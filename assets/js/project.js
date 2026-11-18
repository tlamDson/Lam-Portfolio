AOS.init();
/* Project Cards */

const projectcards = document.querySelector(".projectcards");

// Array of object for projects. A link is shown only when its URL is non-empty.
const projects = [
  {
    title: "GitHub Analytics Data Pipeline",
    cardImage: "assets/images/project-page/repopulse.webp",
    description:
      "Data platform that measures open-source project health from public GitHub events: an hourly PySpark, Delta Lake and dbt pipeline on real GH Archive data for 58 repos, with a public dashboard.",
    tags: ["Python", "PySpark", "Delta Lake", "dbt", "DuckDB", "MotherDuck", "GitHub Actions"],
    result:
      "Dashboard query 0.94 s with 80% less data scanned (1,492 MB to 290 MB).",
    metrics: [
      "27 of 27 injected data faults caught, 0 false alarms.",
      "DuckDB 17-51x faster than Spark on the same transform.",
    ],
    Previewlink: "https://tlamdson.github.io/github-analytics-data-pipeline/",
    Githublink: "https://github.com/tlamDson/github-analytics-data-pipeline",
  },
  {
    title: "Operating System",
    cardImage: "assets/images/project-page/os.webp",
    description:
      "A UNIX-like kernel implementing core system calls (fork, wait, exit) and thread-safe inter-process communication using block-based bounded queues.",
    tags: ["C", "x86-64", "POSIX", "QEMU"],
    result:
      "Verified across 500 fork/exit cycles, returning the process table to its exact baseline count.",
    Previewlink: "",
    Githublink: "https://github.com/tlamDson/Operating_System_OSV",
  },
  {
    title: "Custom Shell",
    cardImage: "assets/images/project-page/shell.webp",
    description:
      "A custom command-line interpreter in C that manages process execution via fork-exec patterns, handles signal interrupts, and supports built-in navigation.",
    tags: ["C", "POSIX", "Make"],
    result:
      "Supports pipes, redirection, background jobs, batch mode, &amp;&amp; / || short-circuiting and aliases with loop protection.",
    Previewlink: "",
    Githublink: "https://github.com/tlamDson/CustomShell",
  },
  {
    title: "Dickinson Market",
    cardImage: "assets/images/project-page/dsonmarket-site.webp",
    description:
      "Led a team of 6 developers to build an online marketplace for Dickinson College.",
    tags: ["Next.js"],
    result: "Serves 2,500+ students and faculty.",
    Previewlink: "",
    Githublink: "",
  },
  {
    title: "TravelPlan",
    cardImage: "assets/images/project-page/plancare.webp",
    description:
      "Agentic travel planner monorepo with AI-powered itinerary generation: React web app, Express API, and BullMQ workers backed by MongoDB and Redis.",
    tags: ["TypeScript", "React", "Express", "MongoDB", "Redis", "BullMQ"],
    result:
      "Cut PR defects from over 10% of 200+ PRs to under one in the last 50.",
    metrics: [
      "Backend coverage 0% to 61.6% (494 unit + 107 integration tests).",
    ],
    Previewlink: "https://plancare-web-omega.vercel.app",
    Githublink: "https://github.com/tlamDson/TravelPlan",
  },
];

const cardLink = (url, label) =>
  url
    ? `<a class="card-link" href="${url}" target="_blank" rel="noopener">${label}</a>`
    : "";

// function for rendering project cards data
const showCards = () => {
  let output = "";
  projects.forEach(
    ({ title, cardImage, description, tags, result, metrics = [], Previewlink, Githublink }) => {
      const links = cardLink(Previewlink, "Live demo") + cardLink(Githublink, "Code");
      output += `
        <div class="column skill-card card" style="margin: 15px" data-aos="zoom-in-up" data-aos-easing="linear" data-aos-delay="300" data-aos-duration="600">
          <div class="wrapper"><img src="${cardImage}" alt="${title} screenshot" width="800" height="500" loading="lazy" decoding="async"></div>
          <div class="card-body-text">
            <h3 class="title">${title}</h3>
            <p class="card-desc">${description}</p>
            <ul class="card-tags">${tags.map((t) => `<li>${t}</li>`).join("")}</ul>
            <p class="card-result">${result}</p>
            ${metrics.length ? `<ul class="card-metrics">${metrics.map((m) => `<li>${m}</li>`).join("")}</ul>` : ""}
            ${links ? `<p class="card-links">${links}</p>` : ""}
          </div>
        </div>`;
    }
  );
  projectcards.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", showCards);
