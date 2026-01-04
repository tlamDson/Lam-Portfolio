AOS.init();

//  Tech Stacks cards

const techStackCards = document.querySelector(".techstack-box");
const techStack = [
  // Backend Frameworks & Runtime
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
    langImage: "assets/images/techstack-page/supabase.jpg",
    langName: "Supabase",
    langDesc:
      "<li>Supabase is an open source Firebase alternative providing a Postgres database, authentication, instant APIs, and real-time subscriptions</li>",
  },
  // Cloud & Infrastructure
  {
    langImage: "assets/images/techstack-page/Amazon_Web_Services_Logo.svg.png",
    langName: "AWS",
    langDesc:
      "<li>Amazon Web Services (AWS) including Lambda, S3, DynamoDB, and Bedrock for serverless computing, storage, NoSQL database, and AI/ML services</li>",
  },
  {
    langImage: "assets/images/techstack-page/Linux.png",
    langName: "Linux",
    langDesc:
      "<li>Linux is a family of open-source Unix-like operating systems, widely used for servers, development environments, and cloud infrastructure</li>",
  },
  {
    langImage: "assets/images/techstack-page/Redis-Logo.wine.png",
    langName: "Redis",
    langDesc:
      "<li>Redis is an in-memory data structure store used as a database, cache, message broker, and streaming engine</li>",
  },
  // Databases
  {
    langImage: "assets/images/techstack-page/sql.jpg",
    langName: "SQL",
    langDesc:
      "<li>SQL (Structured Query Language) is a standard language for storing, manipulating and retrieving data in relational databases</li>",
  },
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
    langImage: "assets/images/techstack-page/Firebase.png",
    langName: "Firebase",
    langDesc:
      "<li>Firebase is a platform developed by Google for creating mobile and web applications, offering real-time database, authentication, and hosting services</li>",
  },
  // Frontend
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
  // Libraries
  {
    langImage: "assets/images/techstack-page/socketio.png",
    langName: "Socket.io",
    langDesc:
      "<li>Socket.io enables real-time, bidirectional and event-based communication between web clients and servers</li>",
  },
  {
    langImage: "assets/images/techstack-page/pandas.png",
    langName: "Pandas",
    langDesc:
      "<li>Pandas is a fast, powerful, flexible and easy to use open source data analysis and manipulation library for Python</li>",
  },
  {
    langImage: "assets/images/techstack-page/numpy.png",
    langName: "NumPy",
    langDesc:
      "<li>NumPy is the fundamental package for scientific computing with Python, providing support for large, multi-dimensional arrays and matrices</li>",
  },
  // Languages
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
    langImage: "assets/images/techstack-page/python.png",
    langName: "Python",
    langDesc:
      "<li>Python is an interpreted high-level general-purpose programming language used for data analysis, machine learning, and backend development</li>",
  },
  {
    langImage: "assets/images/techstack-page/c.png",
    langName: "C",
    langDesc:
      "<li>C is a general-purpose, procedural computer programming language supporting structured programming, lexical variable scope, and recursion, with a static type system</li>",
  },
];

const displayTechStacksCards = () => {
  const entireCardTemplate = techStack
    .map((stack) => {
      return `        
    <div class="row page-content techstackcards" data-aos="fade-up" data-aos-easing="linear" data-aos-delay="0" data-aos-duration="400"> 
        <div class="tech_card">
            <div class="card_img">
                <img src ="${stack.langImage}" class="featured_image">
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
    </div>
      `;
    })
    .join("");
  techStackCards.innerHTML = entireCardTemplate;
};
// displayTechStacksCards(techStack)
document.addEventListener("DOMContentLoaded", displayTechStacksCards);
