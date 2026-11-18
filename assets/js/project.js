AOS.init();
/* Project Cards */

const projectcards = document.querySelector(".projectcards");

// Array of object for projects. A link is shown only when its URL is non-empty.
const projects = [
  {
    title: "Operating System",
    cardImage: "assets/images/project-page/os.png",
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
    cardImage: "assets/images/project-page/shell.png",
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
    cardImage: "assets/images/project-page/dsonmarket-site.png",
    description:
      "Led a team of 6 developers to build an online marketplace for Dickinson College.",
    tags: ["Next.js"],
    result: "Serves 2,500+ students and faculty.",
    Previewlink: "",
    Githublink: "",
  },
  {
    title: "PlanCare",
    cardImage: "assets/images/project-page/plancare.png",
    description:
      "Agentic travel planner monorepo with AI-powered itinerary generation: React web app, Express API, and BullMQ workers backed by MongoDB and Redis.",
    tags: ["TypeScript", "React", "Express", "MongoDB", "Redis", "BullMQ"],
    result:
      "Cut PR defects from over 10% of 200+ PRs to under one in the last 50.",
    Previewlink: "https://plancare-web-omega.vercel.app",
    Githublink: "https://github.com/tlamDson/plancare",
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
    ({ title, cardImage, description, tags, result, Previewlink, Githublink }) => {
      const links = cardLink(Previewlink, "Live demo") + cardLink(Githublink, "Code");
      output += `
        <div class="column skill-card card" style="margin: 15px" data-aos="zoom-in-up" data-aos-easing="linear" data-aos-delay="300" data-aos-duration="600">
          <div class="wrapper" role="img" aria-label="${title} screenshot" style="background: url(${cardImage}) center / cover no-repeat;"></div>
          <div class="card-body-text">
            <h3 class="title">${title}</h3>
            <p class="card-desc">${description}</p>
            <ul class="card-tags">${tags.map((t) => `<li>${t}</li>`).join("")}</ul>
            <p class="card-result">${result}</p>
            ${links ? `<p class="card-links">${links}</p>` : ""}
          </div>
        </div>`;
    }
  );
  projectcards.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", showCards);
