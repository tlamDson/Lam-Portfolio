/*Research Details Table*/

const researchTable = document.querySelector(".main");

// Facts from the master resume (Research section). Newest first.
const research = [
  {
    title: "Underwater Object Detection",
    authors: "With Water Resources University",
    conferences: "Machine Learning Researcher | YOLOv8, PyTorch, OpenCV, Python",
    researchYr: "May 2026 – Aug 2026",
    image: "assets/images/research-page/underwaterdection.png",
    alt: "Underwater object detection research",
    abstract: [
      "Engineered an enhanced computer vision pipeline in PyTorch, integrating CLAHE preprocessing for low-visibility enhancement and fine-tuning YOLOv8's high-resolution P2 layer to detect small, obscured underwater objects across URPC2020 (7,543 images, 4 classes) under a 7:2:1 train/val/test split.",
      "Beat baseline YOLOv8 by 3.3 points in mAP50 (to 84.3%) and 5.9 points in mAP50-95 (to 47.9%), driving Precision to 82.1% (+6.1) and Recall to 75.9% (+5.9) across 6+ ablations isolating CLAHE, the P2 head, and loss function.",
    ],
    absbox: "absPopup1",
  },
  {
    title: "Hyperbot AutoResearch",
    authors: "With Dickinson College",
    conferences: "Machine Learning Researcher | Python, PyTorch",
    researchYr: "Jan 2026 – May 2026",
    image: "assets/images/research-page/Dickinson.png",
    alt: "Dickinson College",
    abstract: [
      "Engineered an automated MLOps framework (Hyperbot) to systematically explore and evaluate hyperparameter spaces for character-level sequence prediction models tasked with large-scale arithmetic, up to 100-digit addition and multiplication.",
      "Cut 100-digit time-to-best-config from 20 to 5 minutes at 100% accuracy by replacing one-at-a-time tuning with automated sweeps of 50 configurations across 4 rounds, each seeded by the prior round's champion.",
    ],
    absbox: "absPopup2",
  },
];
AOS.init();
const fillData = () => {
  let output = "";
  research.forEach(
    ({ image, alt, title, authors, conferences, researchYr, absbox, abstract }) =>
      (output += `
            <tr data-aos="zoom-in-left"> 
                <td class="imgCol"><img src="${image}" class="rImg" alt="${alt}"></td>
                <td class = "researchTitleName">
                    <div class="img-div">
                        <span class="imgResponsive">
                            <img src="${image}" class="imgRes" alt="${alt}">
                        </span>
                    </div>
                    <a href="#0" class="paperTitle"> ${title} </a> 
                    <div class = "authors"> ${authors} </div> 
                    
                    <div class="rConferences"> ${conferences} 
                        <div class="researchY">${researchYr}</div>
                    </div>
                    
                    <div class="d-flex" style="margin-right:5%;">
                        <button class="button button-accent button-small text-right button-abstract " type="button" data-toggle="collapse" data-target="#${absbox}" aria-expanded="false" aria-controls="${absbox}">
                            DETAILS
                        </button>
                    </div>
                    <div id="${absbox}" class="collapse">
                        <div class="card-body">
                            <ul>${abstract.map((b) => `<li>${b}</li>`).join("")}</ul>
                        </div>
                    </div>
                </td>
            </tr>`)
  );
  researchTable.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", fillData);
