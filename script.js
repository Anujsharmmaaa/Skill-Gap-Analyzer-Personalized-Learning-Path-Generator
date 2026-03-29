const state = {
  jobRoleSkills: [],
  learningResources: [],
  skillsMetadata: []
};

const form = document.querySelector("#analyzerForm");
const targetRoleSelect = document.querySelector("#targetRole");
const knownSkillsInput = document.querySelector("#knownSkills");
const goalLevelSelect = document.querySelector("#goalLevel");
const studentNameInput = document.querySelector("#studentName");
const sampleProfileBtn = document.querySelector("#sampleProfileBtn");
const readinessScoreEl = document.querySelector("#readinessScore");
const summaryTextEl = document.querySelector("#summaryText");
const strengthListEl = document.querySelector("#strengthList");
const gapListEl = document.querySelector("#gapList");
const skillGapBarsEl = document.querySelector("#skillGapBars");
const roadmapEl = document.querySelector("#roadmap");
const projectListEl = document.querySelector("#projectList");
const resourceListEl = document.querySelector("#resourceList");

async function loadCsv(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map(item => item.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(item => item.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function normalizeText(value) {
  return String(value).trim().toLowerCase();
}

function formatText(value) {
  return value
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initRoleOptions() {
  targetRoleSelect.innerHTML = "";
  const roles = [...new Set(state.jobRoleSkills.map(row => row.job_role))].sort();

  roles.forEach(role => {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = formatText(role);
    targetRoleSelect.appendChild(option);
  });
}

function setSampleProfile() {
  targetRoleSelect.value = "data scientist";
  knownSkillsInput.value = "python, statistics, sql";
  goalLevelSelect.value = "intermediate";
  studentNameInput.value = "Anuj";
}

function getKnownSkills() {
  return knownSkillsInput.value
    .split(",")
    .map(skill => normalizeText(skill))
    .filter(Boolean);
}

function getRoleSkills(role) {
  return state.jobRoleSkills.filter(row => row.job_role === role);
}

function getSkillMetadata(skill, level) {
  return state.skillsMetadata.find(
    row => row.skill === skill && row.difficulty === level
  );
}

function getSkillResources(skill, level) {
  const exactMatch = state.learningResources.filter(
    row => row.skill === skill && row.level === level
  );

  if (exactMatch.length > 0) {
    return exactMatch;
  }

  return state.learningResources.filter(row => row.skill === skill);
}

function importanceScore(value) {
  const scores = { high: 3, medium: 2, low: 1 };
  return scores[value] || 0;
}

function calculateAnalysis(role, knownSkills, goalLevel, studentName) {
  const roleSkills = getRoleSkills(role);
  const knownSet = new Set(knownSkills);

  const matchedSkills = roleSkills.filter(item => knownSet.has(item.skill));
  const missingSkills = roleSkills.filter(item => !knownSet.has(item.skill));

  const matchScore = roleSkills.length
    ? Math.round((matchedSkills.length / roleSkills.length) * 100)
    : 0;

  const missingSkillDetails = missingSkills.map(item => {
    const metadata = getSkillMetadata(item.skill, goalLevel) || null;
    const resources = getSkillResources(item.skill, goalLevel).slice(0, 2);

    return {
      ...item,
      metadata,
      resources
    };
  });

  const roadmap = [...missingSkillDetails]
    .sort((a, b) => importanceScore(b.importance) - importanceScore(a.importance))
    .map((item, index) => ({
      step: index + 1,
      title: formatText(item.skill),
      description: `Learn ${formatText(item.skill)} at ${goalLevel} level. Priority is ${item.importance}.`
    }));

  const skillCards = missingSkillDetails.map(item => ({
    type: item.metadata ? item.metadata.category : "general",
    title: formatText(item.skill),
    description: item.metadata
      ? `Category: ${item.metadata.category}, Difficulty: ${item.metadata.difficulty}`
      : "Metadata not found"
  }));

  const recommendedResources = missingSkillDetails.flatMap(item =>
    item.resources.map(resource => ({
      type: resource.resource_type,
      title: resource.resource_name,
      description: `${formatText(item.skill)} (${resource.level})`,
      link: resource.link
    }))
  );

  const name = studentName.trim() || "Student";
  const summary = `${name}, you are ${matchScore}% matched for the ${formatText(role)} role.`;

  return {
    matchScore,
    summary,
    roleSkills,
    matchedSkills,
    missingSkills,
    roadmap,
    skillCards,
    recommendedResources
  };
}

function renderTagList(container, items, emptyMessage, showImportance = false) {
  container.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = emptyMessage;
    container.appendChild(li);
    return;
  }

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = showImportance
      ? `${formatText(item.skill)} (${item.importance})`
      : formatText(item.skill);
    container.appendChild(li);
  });
}

function renderGapBars(items, knownSkills) {
  skillGapBarsEl.innerHTML = "";
  const knownSet = new Set(knownSkills);

  items.forEach(item => {
    const isKnown = knownSet.has(item.skill);

    const wrapper = document.createElement("div");
    wrapper.className = "gap-bar";
    wrapper.innerHTML = `
      <div class="gap-bar-header">
        <strong>${formatText(item.skill)}</strong>
        <span>${isKnown ? "Known" : "Missing"} | ${item.importance}</span>
      </div>
      <div class="gap-track">
        <div class="gap-target" style="width: 100%"></div>
        <div class="gap-current" style="width: ${isKnown ? "100%" : "30%"}"></div>
      </div>
    `;
    skillGapBarsEl.appendChild(wrapper);
  });
}

function renderRoadmap(items) {
  roadmapEl.innerHTML = "";

  if (!items.length) {
    roadmapEl.innerHTML = `
      <article class="roadmap-item">
        <div class="roadmap-copy">
          <h4>No missing subjects</h4>
          <p>You already match the required skills for this role.</p>
        </div>
      </article>
    `;
    return;
  }

  items.forEach(item => {
    const article = document.createElement("article");
    article.className = "roadmap-item";
    article.innerHTML = `
      <span class="roadmap-week">Step ${item.step}</span>
      <div class="roadmap-copy">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
      </div>
    `;
    roadmapEl.appendChild(article);
  });
}

function renderCards(container, items, emptyMessage) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `
      <article class="resource-item">
        <div class="resource-copy">
          <p>${emptyMessage}</p>
        </div>
      </article>
    `;
    return;
  }

  items.forEach(item => {
    const article = document.createElement("article");
    article.className = "resource-item";
    article.innerHTML = `
      <span class="resource-type">${item.type}</span>
      <div class="resource-copy">
        <h4>${item.title}</h4>
        <p>${item.description}</p>
        ${item.link ? `<a class="resource-link" href="${item.link}" target="_blank">Open Resource</a>` : ""}
      </div>
    `;
    container.appendChild(article);
  });
}

function renderAnalysis(result, knownSkills) {
  readinessScoreEl.textContent = `${result.matchScore}%`;
  summaryTextEl.textContent = result.summary;
  renderTagList(strengthListEl, result.matchedSkills, "No matched skills found.");
  renderTagList(gapListEl, result.missingSkills, "No missing subjects found.", true);
  renderGapBars(result.roleSkills, knownSkills);
  renderRoadmap(result.roadmap);
  renderCards(projectListEl, result.skillCards, "No metadata found.");
  renderCards(resourceListEl, result.recommendedResources, "No resources found.");
}

async function initApp() {
  try {
    const [jobRoleSkills, learningResources, skillsMetadata] = await Promise.all([
      loadCsv("./data/job_role_skills.csv"),
      loadCsv("./data/learning_resources.csv"),
      loadCsv("./data/skills_metadata.csv")
    ]);

    state.jobRoleSkills = jobRoleSkills.map(row => ({
      ...row,
      job_role: normalizeText(row.job_role),
      skill: normalizeText(row.skill),
      importance: normalizeText(row.importance)
    }));

    state.learningResources = learningResources.map(row => ({
      ...row,
      skill: normalizeText(row.skill),
      level: normalizeText(row.level)
    }));

    state.skillsMetadata = skillsMetadata.map(row => ({
      ...row,
      skill: normalizeText(row.skill),
      category: normalizeText(row.category),
      difficulty: normalizeText(row.difficulty)
    }));

    initRoleOptions();
    setSampleProfile();

    form.addEventListener("submit", event => {
      event.preventDefault();

      const knownSkills = getKnownSkills();
      const result = calculateAnalysis(
        targetRoleSelect.value,
        knownSkills,
        goalLevelSelect.value,
        studentNameInput.value
      );

      renderAnalysis(result, knownSkills);
    });

    sampleProfileBtn.addEventListener("click", setSampleProfile);
    form.dispatchEvent(new Event("submit"));
  } catch (error) {
    summaryTextEl.textContent = error.message;
    console.error(error);
  }
}

initApp();
