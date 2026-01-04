AOS.init();

//  Work experience cards

const experiencecards = document.querySelector(".experience-cards");
const exp = [
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/Pal_AI.jpg",
    place: "Pal AI",
    time: "(October 2025 - Present)",
    desp: "<li>Engineered the core backend infrastructure for an AI-powered college assisting platform on Supabase, enabling real-time essay analysis for 500+ applicants by designing scalable database schemas.</li><li>Optimized API latency by 70% (400ms to 120ms) by implementing cursor-based pagination and lazy loading for college datasets and chat history.</li><li>Reduced API calls to the primary database by 60% by designing and deploying a Redis-based caching layer for high-traffic endpoints.</li>",
  },
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/USTechBridge.jpg",
    place: "USTechBridge",
    time: "(November 2025 - Present)",
    desp: "<li>Engineered a voice-controlled backend service using AWS Bedrock to autonomously manage doctor appointments and complex patient queries.</li><li>Architected a low-latency serverless backend on AWS Lambda using DynamoDB for state and S3 for logging; optimized data retrieval patterns reduced latency by 40% (to sub-200ms) for real-time interactions.</li>",
  },
  {
    title: "Software Engineer Intern",
    cardImage: "assets/images/experience-page/FPT.png",
    place: "FPT Software",
    time: "(May 2025 - September 2025)",
    desp: "<li>Enabled centralized workflow tracking for 1000+ employees by architecting a scalable RESTful API, successfully processing 3,000+ daily task transactions with optimal data integrity.</li><li>Completed the project 3 weeks ahead of schedule by proactively proposing and implementing an AI-powered workflow validation feature.</li><li>Improved task synchronization speed by 40% by implementing atomic database transactions and batch processing logic.</li>",
  },
];

const showCards2 = () => {
  let output = "";
  exp.forEach(
    ({ title, cardImage, place, time, desp }) =>
      (output += `        
    <div class="col gaap" data-aos="fade-up" data-aos-easing="linear" data-aos-delay="100" data-aos-duration="400"> 
      <div class="card card1">
        <img src="${cardImage}" class="featured-image"/>
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
      
      <img src="${cardImage}" height="250" width="65" class="card-img" style="border-radius:10px">
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
