const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

const promptEl = document.querySelector(".prompt__textarea");
const shuffleBtn = document.querySelector(".prompt__generate-btn");
const themeBtnEl = document.querySelector(".theme__btn");
const formEl = document.querySelector(".prompt-form");
const modelSelectEl = document.querySelector("#model");
const imageCountSelectEl = document.querySelector("#image-count");
const aspectRatioSelectEl = document.querySelector("#aspect-ratio");
const galleryEl = document.querySelector(".gallery");
const generateBtn = document.querySelector(".generate-btn");

const savedTheme = localStorage.getItem("theme");

shuffleBtn.addEventListener("click", () => {
  const result =
    examplePrompts[Math.floor(Math.random() * examplePrompts.length)];

  promptEl.value = result;
});

function setTheme() {
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    themeBtnEl.querySelector("i").className = "fa-solid fa-sun";
  }
}

function toggleTheme() {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeBtnEl.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
}

function getImageSize(aspectRatio, baseSize = 512) {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
}

function updateImageCards(imgIndex, imgUrl) {
  const imgCard = document.querySelector(`#img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img src="${imgUrl}" class="gallery__img" />
    <div class="gallery__card-overlay">
      <a href="${imgUrl}" class="gallery__download-btn" download="${Date.now()}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `;
}

async function generateImages(model, imageCount, aspectRatio, promptText) {
  const serverUrl = "https://text-to-image-api-3l0l.onrender.com/generate";
  const { width, height } = getImageSize(aspectRatio);
  generateBtn.setAttribute("disabled", "true");

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      const response = await fetch(serverUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          prompt: promptText,
          width,
          height,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const result = await response.blob();
      updateImageCards(i, URL.createObjectURL(result));
    } catch (error) {
      const msg = getErrorMessage(error);
      const imgCard = document.querySelector(`#img-card-${i}`);
      imgCard.classList.replace("loading", "error");
      imgCard.innerHTML = `
        <div class="error-card">
          <i class="fa-solid fa-triangle-exclamation triangle"></i>
          <p class="status-text">${msg}</p>
        </div>
      `;
      console.log(error);
    }
  });

  await Promise.allSettled(imagePromises);
  generateBtn.removeAttribute("disabled");
}

function getErrorMessage(error) {
  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("depleted")) {
    return "You reached your monthly credits limit";
  } else if (errorMessage.includes("not supported")) {
    return "Selected model is not available";
  } else if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch")
  ) {
    return "Network error. Please try again";
  }
  return "Something went wrong";
}

function createImageCard(model, imageCount, aspectRatio, promptText) {
  galleryEl.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    galleryEl.innerHTML += `
      <div class="gallery__card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio}"}>
        <div class="loading-card">
          <div class="spiner"></div>
          <p class="loading-text">Generating</p>
        </div>
      </div>
    `;
  }

  generateImages(model, imageCount, aspectRatio, promptText);
}

function formHandler(e) {
  e.preventDefault();
  const model = modelSelectEl.value;
  const imageCount = +imageCountSelectEl.value || 1;
  const aspectRatio = aspectRatioSelectEl.value || "1/1";
  const promptText = promptEl.value.trim();
  createImageCard(model, imageCount, aspectRatio, promptText);
}

formEl.addEventListener("submit", formHandler);
themeBtnEl.addEventListener("click", toggleTheme);
setTheme();
