AOS.init();

//  Work experience cards

const experiencecards = document.querySelector(".experience-cards");
const exp = [
  {
    title: "AI Engineer Intern",
    cardImage: "assets/images/experience-page/hbc_nexus_logo.png",
    alt: "HBC Nexus logo",
    place: "HBC Nexus",
    time: "(June 2026 - August 2026)",
    desp: "<li>Scaled a B2B computer vision backend from 10,000 to 50,000 daily images by moving from single-tenant to multi-tenant, reworking tenant routing and authentication, and authoring the Expand &rarr; Backfill &rarr; Contract schema migration that cut the database over without downtime, improving the efficiency of the retail service.</li><li>Cut the full agent test cycle 83% (12 minutes to 2 minutes) across 12 AI agents by parallelizing tests with a GitHub Actions matrix and mocking Kafka, MinIO, and Qdrant to unblock backend work while agents were still in progress.</li><li>Owned the GitHub Actions CI/CD pipeline, identifying failures in 12% of PR runs before they reached production by gating merges on unit and integration tests with an 80% coverage floor against Dockerized staging builds.</li><li>Cut production query time by 60% across 9 FastAPI and PostgreSQL endpoints by designing them to store 3 variable-shape pipeline fields in native JSONB as indexed, queryable columns instead of fully normalizing the schema.</li>",
  },
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/Pal_AI.png",
    alt: "Pal AI logo",
    place: "Pal AI",
    time: "(January 2026 - May 2026)",
    desp: "<li>Owned backend infrastructure as the sole engineer on Supabase for an AI college advising platform serving 1,500 students, designing the database schemas behind essay analysis and chat.</li><li>Cut chat API latency 70% (400ms to 120ms) with cursor-based pagination and lazy loading, and primary-database queries 60% with a Redis layer caching the context every chat session reloads.</li><li>Held a 97%+ pass rate in production by hardening the chat pipeline against provider outages with queue-paced retries and typed error classification, falling back to prepared responses when the model API failed.</li><li>Improved AI context awareness across over 1,000 PDFs and 5,000+ images by embedding student uploads into pgvector via LlamaParse, letting GPT-4o mini reference them instead of summarizing each file once.</li>",
  },
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/USTechBridge.jpg",
    alt: "USTechBridge logo",
    place: "USTechBridge",
    time: "(September 2025 - December 2025)",
    desp: "<li>Built a voice-controlled AI agent reaching 95%+ success rate across 5 intent types, integrating Alexa and AWS Bedrock with Lambda and DynamoDB.</li><li>Cut AI usage cost by 57% across 200K monthly requests by benchmarking and shipping tiered model routing that sends booking and rescheduling to Sonnet and 70% of read-only queries to Haiku while holding success rate over 95%.</li><li>Cut intent-recognition error rate from 50% to 1% on a 500-case golden set by adding a pre-parsing step that segments raw transcribed speech before Sonnet synthesizes intent, validated across 5 iterations before deploying.</li>",
  },
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/FPT.png",
    alt: "FPT Software logo",
    place: "FPT Software",
    time: "(May 2025 - September 2025)",
    desp: "<li>Built an AI-assisted travel planner for 3,000+ users in React, Node.js/Express, and MongoDB, grounding Gemini-generated itineraries in real place data.</li><li>Cut hallucinated place suggestions from 20% to under 1% across 50,000+ generated trips by seeding the RAG corpus with Serper-scraped place data across 64 cities (850+ place insights).</li>",
  },
];

const showCards2 = () => {
  let output = "";
  exp.forEach(
    ({ title, cardImage, alt, place, time, desp }) =>
      (output += `        
    <div class="col gaap" data-aos="fade-up" data-aos-easing="linear" data-aos-delay="100" data-aos-duration="400"> 
      <div class="card card1">
        <img src="${cardImage}" class="featured-image" alt="${alt}"/>
        <article class="card-body">
          <header>
            <div class="title">
              <h3>${title}</h3>
            </div>
            <p class="meta">
              <span class="pre-heading">${place}</span><br>
              <span class="author">${time}</span>
            </p>
            <ol>
              ${desp}
            </ol>
          </header>
        </article>
      </div>
    </div>
      `)
  );
  experiencecards.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", showCards2);

// Volunteership Cards - Open Source Section

const volunteership = document.querySelector(".volunteership");
const volunteershipcards = [
  {
    title: "FarmData2",
    cardImage: "assets/images/experience-page/FarmData2.jpg",
    description:
      "Contributed to FarmData2, an open-source project for agricultural data management.",
  },
];

const showCards = () => {
  let output = "";
  volunteershipcards.forEach(
    ({ title, cardImage, description }) =>
      (output += `        
      <div class="card volunteerCard" data-aos="fade-down" data-aos-easing="linear" data-aos-delay="100" data-aos-duration="600" style="height: 550px;width:400px">
      
      <img src="${cardImage}" height="250" width="65" class="card-img" style="border-radius:10px" alt="${title} project logo">
      <div class="content">
          <h2 class="volunteerTitle">${title}</h2><br>
          <p class="copy">${description}</p></div>
      
      </div>
      `)
  );
  volunteership.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", showCards);

// Hackathon Section - can be repurposed for other content

const hackathonsection = document.querySelector(".hackathon-section");
const mentor = [];

const showCards3 = () => {
  if (!hackathonsection) return; // section temporarily commented out in experience.html
  let output = "";
  mentor.forEach(
    ({ title, image, subtitle, desp, href }) =>
      (output += `
      <div class="blog-slider__item swiper-slide">
        <div class="blog-slider__img">
            <img src="${image}" alt="">
        </div>
        <div class="blog-slider__content">
          <div class="blog-slider__title">${title}</div>
          <span class="blog-slider__code">${subtitle}</span>
          <div class="blog-slider__text">${desp}</div>
          <a href="${href}" class="blog-slider__button">Read More</a>
        </div>
      </div>
      `)
  );
  hackathonsection.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", showCards3);
