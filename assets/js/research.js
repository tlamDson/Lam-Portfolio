/*Research Details Table*/

const researchTable = document.querySelector(".main");

const research = [
  {
    title: "Underwater Object Detection with Enhanced YOLOv8",
    authors: "Water Resources University",
    conferences: "Machine Learning Research Collaboration",
    researchYr: 2026,
    citebox: "popup1",
    image: "assets/images/research-page/underwaterdection.png",
    citation: {
      vancouver:
        "Pham, L. Underwater Object Detection with Enhanced YOLOv8. Water Resources University Research Collaboration, 2026.",
    },
    abstract:
      "Engineered an enhanced computer vision pipeline using PyTorch, integrating CLAHE preprocessing for low-visibility enhancement and fine-tuning YOLOv8's high-resolution P2 layer to detect small, obscured underwater objects. Outperformed baseline YOLOv8 by achieving an absolute increase of 3.3% in mAP50 (to 84.3%) and 5.9% in mAP50-95 (to 47.9%), while driving Precision to 82.1% (+6.1%) and Recall to 75.9% (+5.9%).",
    absbox: "absPopup1",
  },
];
AOS.init();
const fillData = () => {
  let output = "";
  research.forEach(
    ({
      image,
      title,
      authors,
      conferences,
      researchYr,
      citebox,
      citation,
      absbox,
      abstract,
    }) =>
      (output += `
            <tr data-aos="zoom-in-left"> 
                <td class="imgCol"><img src="${image}" class="rImg"></td>
                <td class = "researchTitleName">
                    <div class="img-div">
                        <span class="imgResponsive">
                            <img src="${image}" class="imgRes">
                        </span>
                    </div>
                    <a href="#0" class="paperTitle"> ${title} </a> 
                    <div class = "authors"> ${authors} </div> 
                    
                    <div class="rConferences"> ${conferences} 
                        <div class="researchY">${researchYr}</div>
                    </div>
                    
                    <!--CITE BUTTON-->
                    <div class="d-flex" style="margin-right:5%;">
                        <button class="button button-accent button-small text-right button-abstract " type="button" data-toggle="collapse" data-target="#${absbox}" aria-expanded="false" aria-controls="${absbox}">
                            ABSTRACT
                        </button>
                
                        <button class="button button-accent button-small text-right button-abstract " type="button" data-toggle="collapse" data-target="#${citebox}" aria-expanded="false" aria-controls="${citebox}">
                            CITE
                        </button>
                    </div>
                    <div id="${absbox}" class="collapse" aria-labelledby="headingTwo" data-parent=".collapse">
                        <div class="card-body">
                            ${abstract}    
                        </div>
                    </div>
                    <div id="${citebox}" class="collapse" aria-labelledby="headingTwo" data-parent=".collapse">
                        <div class="card-body">
                            ${citation.vancouver}    
                        </div>
                    </div>
                </td>
            </tr>`)
  );
  researchTable.innerHTML = output;
};
document.addEventListener("DOMContentLoaded", fillData);
