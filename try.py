import pandas as pd

# Load datasets
job = pd.read_csv("job_role_skills.csv")
learning = pd.read_csv("learning_resources.csv")
skills = pd.read_csv("skills_metadata.csv")

# Clean text columns
job["job_role"] = job["job_role"].astype(str).str.strip().str.lower()
job["skill"] = job["skill"].astype(str).str.strip().str.lower()
job["importance"] = job["importance"].astype(str).str.strip().str.lower()

learning["skill"] = learning["skill"].astype(str).str.strip().str.lower()
learning["level"] = learning["level"].astype(str).str.strip().str.lower()

skills["skill"] = skills["skill"].astype(str).str.strip().str.lower()
skills["difficulty"] = skills["difficulty"].astype(str).str.strip().str.lower()
skills["category"] = skills["category"].astype(str).str.strip().str.lower()

# User input
target_role = input("Enter Target Role Job: ").strip().lower()
user_skills = input("Enter your skills (comma separated): ").split(",")

# Remove extra spaces and duplicates
user_skills = [s.strip().lower() for s in user_skills if s.strip()]
user_skills = list(set(user_skills))

# Check role exists
all_roles = job["job_role"].unique().tolist()
if target_role not in all_roles:
    print("\nRole not found in dataset.")
    print("Available roles are:")
    for role in sorted(all_roles):
        print("-", role.title())
    exit()

# Required skills for selected role
required_df = job[job["job_role"] == target_role][["skill", "importance"]].drop_duplicates()
required_skills = required_df["skill"].tolist()

# Skill gap
skill_gap = list(set(required_skills) - set(user_skills))
matched_skills = list(set(required_skills).intersection(set(user_skills)))

# Safe match score
if len(required_skills) > 0:
    match_score = (len(matched_skills) / len(required_skills)) * 100
else:
    match_score = 0

print("\n===== ANALYSIS =====")
print("Target Role:", target_role.title())
print("Required Skills:", [s.title() for s in required_skills])
print("Your Skills:", [s.title() for s in user_skills])
print("Matched Skills:", [s.title() for s in matched_skills])
print("Skill Gap:", [s.title() for s in skill_gap])
print(f"Match Score: {match_score:.2f}%")

if len(skill_gap) == 0:
    print("\nYou are already ready for this role.")
else:
    # Gap dataframe
    gap_df = pd.DataFrame(skill_gap, columns=["skill"])

    # Merge with metadata
    merged = gap_df.merge(skills, on="skill", how="left")

    # Merge with importance from job-role table
    merged = merged.merge(required_df, on="skill", how="left")

    # Difficulty sorting
    order = {"beginner": 1, "intermediate": 2, "advanced": 3}
    importance_order = {"high": 1, "medium": 2, "low": 3}

    merged["level_order"] = merged["difficulty"].map(order).fillna(99)
    merged["importance_order"] = merged["importance"].map(importance_order).fillna(99)

    # Sort by importance first, then difficulty
    merged = merged.sort_values(["importance_order", "level_order"])

    print("\n===== MISSING SUBJECT DETAILS =====")
    for _, row in merged.iterrows():
        print(
            f"- {row['skill'].title()} | "
            f"Category: {str(row['category']).title()} | "
            f"Difficulty: {str(row['difficulty']).title()} | "
            f"Importance: {str(row['importance']).title()}"
        )

    print("\n===== LEARNING PATH =====")
    for i, (_, row) in enumerate(merged.iterrows(), 1):
        skill = row["skill"]
        difficulty = row["difficulty"]

        # First try exact difficulty match
        resources = learning[
            (learning["skill"] == skill) & (learning["level"] == difficulty)
        ][["resource_name", "resource_type", "link"]]

        # If exact level not found, show any resources for that skill
        if resources.empty:
            resources = learning[
                learning["skill"] == skill
            ][["resource_name", "resource_type", "link"]]

        print(f"\nStep {i}: Learn {skill.title()}")
        print(f"Difficulty: {str(difficulty).title()}")
        print(f"Importance: {str(row['importance']).title()}")

        if resources.empty:
            print("No resources found for this skill.")
        else:
            for _, res in resources.head(2).iterrows():
                print(
                    f"- {res['resource_name']} "
                    f"({res['resource_type']}): {res['link']}"
                )
