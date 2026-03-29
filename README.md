# Skill-Gap-Analyzer-Personalized-Learning-Path-Generator
Analyzes skill gaps for a target job role and generates a personalized learning path using Python/JavaScript and CSV datasets.

Skill Gap Analyzer & Learning Path Generator is a student project that helps users understand what skills they need for a specific job role. The user enters their target role and current skills, and the system compares them with role-based skill data to find missing subjects. It then suggests a simple learning roadmap and relevant resources to help the user prepare for the job.


Key Features

Enter target job role and known skills
Compare user skills with job-role requirements
Detect missing skills and subjects
Show match score for the selected role
Recommend learning resources from dataset
Generate a simple step-by-step learning path
Easy to use and beginner-friendly interface
Tech Stack

Frontend: HTML, CSS, JavaScript

Backend/Logic: Python, Pandas

Data Storage: CSV files

Tools: VS Code, Live Server


Datasets Used

job_role_skills.csv
learning_resources.csv
skills_metadata.csv
How It Works

User selects a target job role.
User enters current skills.
System reads job-role skill dataset.
It compares required skills with user skills.
Missing skills are identified as the skill gap.
Metadata and resource datasets are used to suggest learning difficulty, category, and study links.
A simple learning path is generated in priority order.
