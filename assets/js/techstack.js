AOS.init();

//  Tech Stacks cards

const techStackCards = document.querySelector(".techstack-box");
// Skill groups follow the Technical Skills section of the master resume.
// `skills` is the full resume line; `cards` are the ones with a logo card.
const techStack = [
  {
    group: "Languages",
    skills: "Python, TypeScript, JavaScript, C, C++, Java",
    cards: [
      {
        langImage: "assets/images/techstack-page/python.png",
        langName: "Python",
        langDesc:
          "<li>Python is an interpreted high-level general-purpose programming language used for data analysis, machine learning, and backend development</li>",
      },
      {
        langImage: "assets/images/techstack-page/typescript.png",
        langName: "TypeScript",
        langDesc:
          "<li>TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale</li>",
      },
      {
        langImage: "assets/images/techstack-page/javascript.png",
        langName: "JavaScript",
        langDesc:
          "<li>JavaScript is a programming language that is one of the core technologies of the World Wide Web, enabling interactive web pages and dynamic content</li>",
      },
      {
        langImage: "assets/images/techstack-page/c.png",
        langName: "C",
        langDesc:
          "<li>C is a general-purpose, procedural computer programming language supporting structured programming, lexical variable scope, and recursion, with a static type system</li>",
      },
      {
        langImage: "assets/images/techstack-page/cpp.png",
        langName: "C++",
        langDesc:
          "<li>C++ is a general-purpose programming language that extends C with classes, templates and a standard library for performance-critical software</li>",
      },
    ],
  },
  {
    group: "Backend",
    skills: "Node.js, Express.js, NestJS, FastAPI, Supabase, Zod, SQLAlchemy, RESTful APIs",
    cards: [
      {
        langImage: "assets/images/techstack-page/node.png",
        langName: "Node.js",
        langDesc:
          "<li>Node.js is an open-source, cross-platform, back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser</li>",
      },
      {
        langImage: "assets/images/techstack-page/expressjs.svg",
        langName: "Express.js",
        langDesc:
          "<li>Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications</li>",
      },
      {
        langImage: "assets/images/techstack-page/fastapi.png",
        langName: "FastAPI",
        langDesc:
          "<li>FastAPI is a modern, high-performance Python web framework for building RESTful APIs, with automatic validation powered by Pydantic</li>",
      },
      {
        langImage: "assets/images/techstack-page/supabase.jpg",
        langName: "Supabase",
        langDesc:
          "<li>Supabase is an open source Firebase alternative providing a Postgres database, authentication, instant APIs, and real-time subscriptions</li>",
      },
    ],
  },
  {
    group: "Frontend",
    skills: "React, React Native, Next.js, Tailwind",
    cards: [
      {
        langImage: "assets/images/techstack-page/react.png",
        langName: "React",
        langDesc:
          "<li>React is a free and open-source front-end JavaScript library for building user interfaces based on UI components</li>",
      },
      {
        langImage: "assets/images/techstack-page/nextjs.png",
        langName: "Next.js",
        langDesc:
          "<li>Next.js is a React framework that enables server-side rendering, static site generation, and building production-ready full-stack applications</li>",
      },
    ],
  },
  {
    group: "Infra &amp; DevOps",
    skills: "Docker, AWS (Lambda, DynamoDB, S3), Cloudflare R2, Railway, Vercel, Git, GitHub Actions, Kafka, MinIO, BullMQ, QEMU, POSIX System Calls",
    cards: [
      {
        langImage: "assets/images/techstack-page/docker.png",
        langName: "Docker",
        langDesc:
          "<li>Docker is a platform for building, shipping, and running applications in lightweight, portable containers</li>",
      },
      {
        langImage: "assets/images/techstack-page/Amazon_Web_Services_Logo.svg.png",
        langName: "AWS",
        langDesc:
          "<li>Amazon Web Services (AWS) including Lambda, S3, DynamoDB, and Bedrock for serverless computing, storage, NoSQL database, and AI/ML services</li>",
      },
      {
        langImage: "assets/images/techstack-page/git.png",
        langName: "Git",
        langDesc:
          "<li>Git is a distributed version control system for tracking changes in source code and collaborating through branches and pull requests</li>",
      },
    ],
  },
  {
    group: "Data",
    skills: "PostgreSQL, MongoDB, Redis, Prisma, pgvector, SQL, dbt, PySpark, Delta Lake, DuckDB, MotherDuck, Snowflake, Tableau",
    cards: [
      {
        langImage: "assets/images/techstack-page/Postgresql_elephant.svg.png",
        langName: "PostgreSQL",
        langDesc:
          "<li>PostgreSQL is a powerful, open source object-relational database system with a strong reputation for reliability, feature robustness, and performance</li>",
      },
      {
        langImage: "assets/images/techstack-page/MongoDB_Logo.svg.png",
        langName: "MongoDB",
        langDesc:
          "<li>MongoDB is a source-available cross-platform document-oriented NoSQL database program, using JSON-like documents with optional schemas</li>",
      },
      {
        langImage: "assets/images/techstack-page/Redis-Logo.wine.png",
        langName: "Redis",
        langDesc:
          "<li>Redis is an in-memory data structure store used as a database, cache, message broker, and streaming engine</li>",
      },
      {
        langImage: "assets/images/techstack-page/sql.jpg",
        langName: "SQL",
        langDesc:
          "<li>SQL (Structured Query Language) is a standard language for storing, manipulating and retrieving data in relational databases</li>",
      },
    ],
  },
  {
    group: "ML &amp; AI",
    skills: "PyTorch, YOLO, OpenCV, OpenAI, Gemini, Claude (Sonnet, Haiku), AWS Bedrock, LlamaParse, Qdrant, RAG, LangChain, MCP",
    cards: [
      {
        langImage: "assets/images/techstack-page/pytorch.jpg",
        langName: "PyTorch",
        langDesc:
          "<li>PyTorch is an open-source machine learning framework used for building and training deep learning models, including computer vision pipelines</li>",
      },
    ],
  },
];

const displayTechStacksCards = () => {
  // Each card is a direct flex item of .skill-group-cards (no row wrapper, no AOS fade:
  // AOS.init runs before the cards exist, so a data-aos card would stay invisible).
  const card = (stack) => `
        <div class="tech_card">
            <div class="card_img">
                <img src ="${stack.langImage}" class="featured_image" alt="${stack.langName} logo">
            </div>
            <div class="card_header">
                <header>
                    <div class="text-center langName">
                        <h4>${stack.langName}</h4>
                    </div>
                </header>
                <ul class="description">
                ${stack.langDesc}
            </ul>
            </div>
        </div>
      `;
  techStackCards.innerHTML = techStack
    .map(
      (g) => `
    <section class="skill-group">
        <h3 class="skill-group-name">${g.group}</h3>
        <p class="skill-group-list">${g.skills}</p>
        <div class="skill-group-cards">${g.cards.map(card).join("")}</div>
    </section>`
    )
    .join("");
};
document.addEventListener("DOMContentLoaded", displayTechStacksCards);
