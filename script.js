const STORAGE_KEY = "littleGardenState";

function getState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      coins: 0,
      flowers: []
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      coins: 0,
      flowers: []
    };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addCoins(amount) {
  const state = getState();
  state.coins += amount;
  saveState(state);
}

function updateCoinDisplays() {
  const state = getState();

  const ids = [
    "coinCount",
    "shopCoins",
    "gameCoins"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = state.coins;
    }
  });
}



function getGuide() {
  return localStorage.getItem("littleGardenGuide") || "bunny";
}

function createGuideMarkup(type) {

  if (type === "bear") {
    return `
      <span class="animal-ear bear-ear-left"></span>
      <span class="animal-ear bear-ear-right"></span>

      <span class="animal-head bear-head">
        <span class="animal-eye eye-left"></span>
        <span class="animal-eye eye-right"></span>
        <span class="bear-muzzle"></span>
        <span class="bear-nose"></span>
      </span>
    `;
  }

  if (type === "duck") {
    return `
      <span class="animal-ear duck-tuft"></span>

      <span class="animal-head duck-head">
        <span class="animal-eye eye-left"></span>
        <span class="animal-eye eye-right"></span>
        <span class="duck-beak"></span>
      </span>
    `;
  }

  return `
    <span class="animal-ear bunny-ear-left"></span>
    <span class="animal-ear bunny-ear-right"></span>

    <span class="animal-head bunny-head">
      <span class="animal-eye eye-left"></span>
      <span class="animal-eye eye-right"></span>
      <span class="bunny-nose"></span>
      <span class="animal-cheek cheek-left"></span>
      <span class="animal-cheek cheek-right"></span>
    </span>
  `;
}

function setupGardenGuide() {

  const avatar = document.getElementById("gardenGuideAvatar");

  if (!avatar) {
    return;
  }

  const guide = getGuide();

  avatar.className = "garden-guide-avatar " + guide + "-avatar";
avatar.innerHTML = createGuideMarkup(guide);

  const character = document.querySelector(".guide-character");

  if (character) {
    character.addEventListener("click", event => {
      event.stopPropagation();
      gardenSpeech("ohh hi there hehe<3");
    });
  }
}


let speechTimer = null;
let editingFlowerIndex = null;
let movingFlowerIndex = null;

function gardenSpeech(text) {

  const speech = document.getElementById("guideSpeech");

  if (!speech) {
    return;
  }

  speech.textContent = text;

  clearTimeout(speechTimer);

  speechTimer = setTimeout(() => {
    speech.textContent = "";
  }, 4000);
}

function setupGarden() {

  const field = document.getElementById("gardenField");

  if (!field) {
    return;
  }

  updateCoinDisplays();
  setupGardenGuide();
  renderFlowers();

  const firstVisit = sessionStorage.getItem("gardenFirstVisit");

  if (firstVisit === "true") {
    gardenSpeech("hii, how are youu<3");
    sessionStorage.removeItem("gardenFirstVisit");
  } else if (sessionStorage.getItem("cameBackFromGame") === "true") {
    gardenSpeech("hey you came back!");
    sessionStorage.removeItem("cameBackFromGame");
  } else if (getState().flowers.length === 0) {
    gardenSpeech("oh your garden looks so empty");
  }

    setupPlanting();
    setupFlowerEditing();
    createRainDrops();
}

function setupPlanting() {

  const field = document.getElementById("gardenField");

  if (!field) {
    return;
  }

  const pending = sessionStorage.getItem("pendingFlower");

  if (!pending) {
    return;
  }

  const data = JSON.parse(pending);

  field.classList.add("ready-to-plant");

  gardenSpeech("click anywhere in the garden to plant it!");

  function placeFlower(event) {

    const rect = field.getBoundingClientRect();

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    x = Math.max(45, Math.min(rect.width - 45, x));
    y = Math.max(80, Math.min(rect.height - 20, y));

    const state = getState();

    state.flowers.push({
      type: data.type,
      color: data.color,
      x,
      y
    });

    saveState(state);

    sessionStorage.removeItem("pendingFlower");

    field.classList.remove("ready-to-plant");
    field.removeEventListener("click", placeFlower);

    renderFlowers();

    gardenSpeech("so pretty");

    setTimeout(() => {
      gardenSpeech("your garden is looking pretty");
    }, 1800);

    if (data.type === "tulip" || data.type === "cosmos") {
      setTimeout(() => {
        gardenSpeech("pulo would love this");
      }, 3600);
    }
  }

  field.addEventListener("click", placeFlower);
}

function renderFlowers() {

  const container = document.getElementById("plantedFlowers");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const state = getState();

  state.flowers.forEach((flower, index) => {

    const plant = document.createElement("div");

    plant.className = "planted-flower";
    plant.style.left = flower.x + "px";
    plant.style.top = flower.y + "px";
    plant.dataset.index = index;
    plant.title = "tap to move or remove";

    let centre = "#e9ad3d";

    if (flower.type === "sunflower") {
      centre = "#916039";
    }

    plant.innerHTML = `
      <span class="plant-stem"></span>
      <span class="plant-leaf left"></span>
      <span class="plant-leaf right"></span>

      <span
        class="planted-head ${flower.type}"
        style="
          --flower-color:${flower.color};
          --flower-centre:${centre};
        "
      ></span>
    `;

    plant.addEventListener("click", event => {
      event.stopPropagation();

      if (movingFlowerIndex !== null) {
        return;
      }

      showFlowerEditPanel(index);
    });

    container.appendChild(plant);
  });
}

function getFlowerEditPanel() {
  return document.getElementById("flowerEditPanel");
}

function showFlowerEditPanel(index) {

  const panel = getFlowerEditPanel();

  if (!panel) {
    return;
  }

  editingFlowerIndex = index;
  panel.classList.remove("hidden");
}

function hideFlowerEditPanel() {

  const panel = getFlowerEditPanel();

  if (panel) {
    panel.classList.add("hidden");
  }

  editingFlowerIndex = null;
}

function removeSelectedFlower() {

  if (editingFlowerIndex === null) {
    return;
  }

  const state = getState();

  state.flowers.splice(editingFlowerIndex, 1);

  saveState(state);
  movingFlowerIndex = null;
  hideFlowerEditPanel();
  renderFlowers();
  gardenSpeech("bye bye little flower");
}

function startMovingFlower() {

  if (editingFlowerIndex === null) {
    return;
  }

  movingFlowerIndex = editingFlowerIndex;
  hideFlowerEditPanel();
  gardenSpeech("click where you want your flower to go!");
}

function cancelFlowerEdit() {
  movingFlowerIndex = null;
  hideFlowerEditPanel();
}

function setupFlowerEditing() {

  const field = document.getElementById("gardenField");

  if (!field) {
    return;
  }

  const moveButton = document.getElementById("moveFlowerButton");
  const removeButton = document.getElementById("removeFlowerButton");
  const cancelButton = document.getElementById("cancelFlowerButton");

  if (moveButton) {
    moveButton.addEventListener("click", event => {
      event.stopPropagation();
      startMovingFlower();
    });
  }

  if (removeButton) {
    removeButton.addEventListener("click", event => {
      event.stopPropagation();
      removeSelectedFlower();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", event => {
      event.stopPropagation();
      cancelFlowerEdit();
    });
  }

  field.addEventListener("click", event => {

    if (movingFlowerIndex === null) {
      return;
    }

    if (event.target.closest(".guide-character")) {
      return;
    }

    const rect = field.getBoundingClientRect();

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    x = Math.max(45, Math.min(rect.width - 45, x));
    y = Math.max(80, Math.min(rect.height - 20, y));

    const state = getState();

    if (state.flowers[movingFlowerIndex]) {
      state.flowers[movingFlowerIndex].x = x;
      state.flowers[movingFlowerIndex].y = y;
      saveState(state);
    }

    movingFlowerIndex = null;
    renderFlowers();
    gardenSpeech("there we go hehe<3");
  });
}


function setWeather(weather) {

  const board = document.getElementById("gardenBoard");

  if (!board) {
    return;
  }

  board.classList.remove(
    "weather-day",
    "weather-evening",
    "weather-night",
    "weather-rain"
  );

  board.classList.add("weather-" + weather);

  document.querySelectorAll(".weather-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.weather === weather
    );
  });

  localStorage.setItem("gardenWeather", weather);

  if (weather === "rain") {
    gardenSpeech("oh its raining");
  }
}

function restoreWeather() {

  const saved = localStorage.getItem("gardenWeather") || "day";

  setWeather(saved);
}

function createRainDrops() {

  const layer = document.getElementById("rainLayer");

  if (!layer) {
    return;
  }

  layer.innerHTML = "";

  for (let i = 0; i < 65; i++) {

    const drop = document.createElement("span");

    drop.className = "rain-drop";

    drop.style.left = Math.random() * 100 + "%";
    drop.style.top = Math.random() * 100 + "%";
    drop.style.animationDelay = Math.random() * .8 + "s";
    drop.style.opacity = .35 + Math.random() * .45;

    layer.appendChild(drop);
  }
}


const flowerData = {

  tulip: {
    price: 8,
    colors: [
      "#ef82aa",
      "#f4c85d",
      "#fff5e9",
      "#b89ad9"
    ]
  },

  rose: {
    price: 12,
    colors: [
      "#e96f77",
      "#ef86a9",
      "#f3ae8e",
      "#f5dfbd"
    ]
  },

  daisy: {
    price: 6,
    colors: [
      "#fff8ef",
      "#f2a7bf",
      "#f5ca54"
    ]
  },

  cosmos: {
    price: 10,
    colors: [
      "#ef8cae",
      "#a985cf",
      "#fff4ea"
    ]
  },

  lavender: {
    price: 10,
    colors: [
      "#9a78bd",
      "#d49ac1",
      "#fff0e4"
    ]
  },

  sunflower: {
    price: 14,
    colors: [
      "#f1bf42",
      "#efa05b",
      "#f7df82"
    ]
  }
};

let selectedFlower = null;
let selectedColor = null;

function setupShop() {

  updateCoinDisplays();
}

function openFlowerShop(type) {

  const modal = document.getElementById("flowerModal");

  if (!modal) {
    return;
  }

  selectedFlower = type;

  const data = flowerData[type];

  selectedColor = data.colors[0];

  document.getElementById("modalFlowerName").textContent = type;

  renderModalFlower(type, selectedColor);
  renderColourSwatches(data.colors);

  const buyButton = document.getElementById("buyFlowerButton");

  buyButton.textContent = "choose this flower · " + data.price + " coins";

  buyButton.onclick = purchaseFlower;

  modal.classList.remove("hidden");
}

function closeFlowerShop() {

  const modal = document.getElementById("flowerModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

function renderColourSwatches(colors) {

  const container = document.getElementById("colourSwatches");

  container.innerHTML = "";

  colors.forEach((color, index) => {

    const swatch = document.createElement("button");

    swatch.className = "colour-swatch";

    if (index === 0) {
      swatch.classList.add("selected");
    }

    swatch.style.background = color;

    swatch.onclick = () => {

      selectedColor = color;

      document.querySelectorAll(".colour-swatch").forEach(item => {
        item.classList.remove("selected");
      });

      swatch.classList.add("selected");

      renderModalFlower(selectedFlower, selectedColor);
    };

    container.appendChild(swatch);
  });
}

function renderModalFlower(type, color) {

  const stage = document.getElementById("modalFlowerStage");

  stage.innerHTML = `
    <div class="flower-preview ${type}-preview">

      <span
        class="${type === "lavender" ? "lavender-stem" : "flower-stem"}"
      ></span>

      <span class="leaf leaf-left"></span>
      <span class="leaf leaf-right"></span>

      <span
        class="${getFlowerHeadClass(type)}"
        style="
          background:${color};
        "
      ></span>

    </div>
  `;
}

function getFlowerHeadClass(type) {

  if (type === "tulip") {
    return "tulip-head";
  }

  if (type === "rose") {
    return "rose-head";
  }

  if (type === "daisy") {
    return "daisy-head";
  }

  if (type === "cosmos") {
    return "cosmos-head";
  }

  if (type === "lavender") {
    return "lavender-bloom bloom-a";
  }

  return "sunflower-head";
}

function purchaseFlower() {

  if (!selectedFlower || !selectedColor) {
    return;
  }

  const state = getState();
  const price = flowerData[selectedFlower].price;

  if (state.coins < price) {

    gardenSpeech("you need a few more coins first");

    alert("You need more coins to buy this flower.");

    return;
  }

  state.coins -= price;

  saveState(state);

  sessionStorage.setItem(
    "pendingFlower",
    JSON.stringify({
      type: selectedFlower,
      color: selectedColor
    })
  );

  location.href = "garden.html";
}


function startGame(game) {

  location.href = "play.html?game=" + game;
}

let gameTimer = null;
let gameEnded = false;
let currentGame = null;
let score = 0;
let timeLeft = 30;

function setupGamePage() {

  const params = new URLSearchParams(location.search);

  currentGame = params.get("game") || "memory";

  score = 0;
  gameEnded = false;

  document.getElementById("score").textContent = "0";

  if (currentGame === "memory") {
    timeLeft = 40;
  } else if (currentGame === "fireflies") {
    timeLeft = 30;
  } else if (currentGame === "petals") {
    timeLeft = 25;
  } else {
    timeLeft = 30;
  }

  document.getElementById("timer").textContent = timeLeft;

  setupStageGuide();

  if (currentGame === "memory") {
    setupMemoryGame();
  }

  if (currentGame === "fireflies") {
    setupFireflyGame();
  }

  if (currentGame === "petals") {
    setupPetalGame();
  }

  if (currentGame === "colour") {
    setupColourGame();
  }

  startGameTimer();
}

function setupStageGuide() {

  const guide = document.getElementById("stageGuide");

  if (!guide) {
    return;
  }

  const type = getGuide();

  guide.className = "stage-guide " + type + "-avatar";
  guide.innerHTML = createGuideMarkup(type);
}

function setStageMessage(text) {

  const message = document.getElementById("stageMessage");

  if (message) {
    message.textContent = text;
  }
}

function startGameTimer() {

  clearInterval(gameTimer);

  gameTimer = setInterval(() => {

    if (gameEnded) {
      return;
    }

    timeLeft--;

    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }

  }, 1000);
}

function updateScore(amount) {

  score += amount;

  document.getElementById("score").textContent = score;
}


function setupMemoryGame() {

  setStageMessage("find all the little pairs!");

  const area = document.getElementById("gameArea");

  const colours = [
    "#ef88a9",
    "#8bbdd0",
    "#f3c95c",
    "#a5c98e"
  ];

  const cards = [...colours, ...colours]
    .sort(() => Math.random() - .5);

  area.innerHTML = `
    <div class="memory-board">
      <div class="memory-grid">
        ${cards.map((color, index) => `
          <button
            class="memory-card"
            data-color="${color}"
            data-index="${index}"
            style="--memory-color:${color}"
          ></button>
        `).join("")}
      </div>
    </div>
  `;

  let first = null;
  let second = null;
  let locked = false;
  let matched = 0;

  document.querySelectorAll(".memory-card").forEach(card => {

    card.addEventListener("click", () => {

      if (locked || card.classList.contains("revealed") || card.classList.contains("matched")) {
        return;
      }

      card.classList.add("revealed");

      if (!first) {
        first = card;
        return;
      }

      second = card;
      locked = true;

      if (first.dataset.color === second.dataset.color) {

        first.classList.add("matched");
        second.classList.add("matched");

        matched++;
        updateScore(2);

        first = null;
        second = null;
        locked = false;

        if (matched === colours.length) {
          setTimeout(endGame, 350);
        }

      } else {

        setTimeout(() => {

          first.classList.remove("revealed");
          second.classList.remove("revealed");

          first = null;
          second = null;
          locked = false;

        }, 700);
      }
    });
  });
}


function setupFireflyGame() {

  timeLeft = 30;

  setStageMessage("catch the little lights!");

  const area = document.getElementById("gameArea");

  area.innerHTML = `
    <div class="firefly-board" id="fireflyBoard"></div>
  `;

  const board = document.getElementById("fireflyBoard");

  for (let i = 0; i < 18; i++) {

    const star = document.createElement("span");

    star.className = "firefly-star";

    star.style.left = Math.random() * 90 + "%";
    star.style.top = Math.random() * 70 + "%";

    board.appendChild(star);
  }

  spawnFirefly(board);
}

function spawnFirefly(board) {

  if (gameEnded) {
    return;
  }

  const old = board.querySelector(".firefly");

  if (old) {
    old.remove();
  }

  const fly = document.createElement("button");

  fly.className = "firefly";

  fly.style.left = 8 + Math.random() * 82 + "%";
  fly.style.top = 8 + Math.random() * 70 + "%";

  fly.onclick = () => {

    updateScore(1);

    fly.remove();

    spawnFirefly(board);
  };

  board.appendChild(fly);
}


function setupPetalGame() {

  timeLeft = 25;

  setStageMessage("catch the drifting petals!");

  const area = document.getElementById("gameArea");

  area.innerHTML = `
    <div class="petal-board" id="petalBoard"></div>
  `;

  const board = document.getElementById("petalBoard");

  let petalSpawner = setInterval(() => {

    if (gameEnded) {
      clearInterval(petalSpawner);
      return;
    }

    spawnCatchPetal(board);

  }, 700);
}

function spawnCatchPetal(board) {

  const petal = document.createElement("button");

  petal.className = "catch-petal";

  petal.style.left = 5 + Math.random() * 90 + "%";

  petal.style.background = [
    "#ef86aa",
    "#c59bdc",
    "#f4c65d",
    "#f2a58f"
  ][Math.floor(Math.random() * 4)];

  petal.onclick = () => {

    updateScore(1);

    petal.remove();
  };

  board.appendChild(petal);

  setTimeout(() => {
    petal.remove();
  }, 2500);
}

const colourChoices = [
  {
    name: "pink",
    color: "#ef8ca9"
  },
  {
    name: "blue",
    color: "#7ebed0"
  },
  {
    name: "yellow",
    color: "#f2ca58"
  },
  {
    name: "green",
    color: "#8fbd7c"
  },
  {
    name: "peach",
    color: "#efa58f"
  },
  {
    name: "lilac",
    color: "#b396d3"
  }
];

let colourTarget = null;
let colourLevel = 1;
let colourRoundDone = false;

function setupColourGame() {

  timeLeft = 30;
  colourLevel = 1;
  colourTarget = null;

  renderColourRound();
}

function renderColourRound() {

  if (gameEnded) {
    return;
  }

  colourRoundDone = false;

  const area = document.getElementById("gameArea");

  const numberOfOptions = Math.min(
    6 + colourLevel,
    10
  );

  colourTarget =
    colourChoices[
      Math.floor(Math.random() * colourChoices.length)
    ];

  const options = [];

  for (let i = 0; i < numberOfOptions; i++) {

    options.push(
      colourChoices[
        Math.floor(Math.random() * colourChoices.length)
      ]
    );
  }

  const matches = Math.max(
    2,
    Math.min(4, Math.floor(numberOfOptions / 3))
  );

  for (let i = 0; i < matches; i++) {
    options[i] = colourTarget;
  }

  options.sort(() => Math.random() - .5);

  area.innerHTML = `
    <div class="colour-board">

      <div class="colour-target">
        find
        <span style="background:${colourTarget.color}"></span>
        ${colourTarget.name}
      </div>

      <div class="colour-options">

        ${options.map((option, index) => `
          <button
            class="colour-option"
            data-colour="${option.name}"
            data-index="${index}"
            style="background:${option.color}"
          ></button>
        `).join("")}

      </div>

    </div>
  `;

  document.querySelectorAll(".colour-option").forEach(option => {

    option.addEventListener("click", () => {

      if (colourRoundDone || gameEnded) {
        return;
      }

      if (option.dataset.colour === colourTarget.name) {

        option.style.opacity = ".35";
        option.disabled = true;

        updateScore(1);

        const remaining = [
          ...document.querySelectorAll(".colour-option")
        ].filter(item =>
          !item.disabled &&
          item.dataset.colour === colourTarget.name
        );

        if (remaining.length === 0) {

          colourRoundDone = true;

          colourLevel++;

          setStageMessage(
            "nice! level " + colourLevel
          );

          setTimeout(renderColourRound, 450);
        }

      } else {

        option.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" }
          ],
          {
            duration: 220
          }
        );
      }
    });
  });
}


function endGame() {

  if (gameEnded) {
    return;
  }

  gameEnded = true;

  clearInterval(gameTimer);

  let reward = 0;

  if (currentGame === "memory") {
    reward = Math.max(8, score + 4);
  }

  if (currentGame === "fireflies") {
    reward = Math.max(5, score + 3);
  }

  if (currentGame === "petals") {
    reward = Math.max(5, score + 3);
  }

  if (currentGame === "colour") {
    reward = Math.max(6, score + colourLevel);
  }

  addCoins(reward);

  const overlay = document.getElementById("resultOverlay");

  document.getElementById("earnedCoins").textContent = reward;

  if (score >= 12) {
    document.getElementById("resultTitle").textContent = "you did amazing";
  } else if (score >= 6) {
    document.getElementById("resultTitle").textContent = "good job";
  } else {
    document.getElementById("resultTitle").textContent = "nice little try";
  }

  overlay.classList.remove("hidden");

  sessionStorage.setItem("cameBackFromGame", "true");

  document.getElementById("playAgainButton").onclick = () => {
    location.reload();
  };
}

function exitGame() {
  clearInterval(gameTimer);
  gameEnded = true;
  location.href = "games.html";
}


document.addEventListener("DOMContentLoaded", () => {

  updateCoinDisplays();

  setupGarden();
  restoreWeather();

  setupShop();

  if (document.getElementById("gameArea")) {
    setupGamePage();
  }
});


function gardenSpeech(text) {

  const speech = document.getElementById("guideSpeech");

  if (!speech) {
    return;
  }

  speech.textContent = text;

  clearTimeout(window.littleGardenSpeechTimer);

  window.littleGardenSpeechTimer = setTimeout(() => {
    speech.textContent = "";
  }, 4000);
}


function setupGardenGuide() {

  const avatar = document.getElementById("gardenGuideAvatar");

  if (!avatar) {
    return;
  }

  const guide = getGuide();

  avatar.className = "garden-guide-avatar " + guide + "-avatar";
  avatar.innerHTML = createGuideMarkup(guide);

  const character = document.querySelector(".guide-character");

  if (character && !character.dataset.guideReady) {

    character.dataset.guideReady = "true";

    character.addEventListener("click", event => {

      event.stopPropagation();

      gardenSpeech("ohh hi there hehe<3");

    });
  }
}



function setupGarden() {

  const field = document.getElementById("gardenField");

  if (!field) {
    return;
  }

  updateCoinDisplays();

  setupGardenGuide();

  renderFlowers();

  const firstVisit = sessionStorage.getItem("gardenFirstVisit");

  if (firstVisit === "true") {

    gardenSpeech("hii, how are youu<3");

    sessionStorage.removeItem("gardenFirstVisit");

  } else if (sessionStorage.getItem("cameBackFromGame") === "true") {

    gardenSpeech("hey you came back!");

    sessionStorage.removeItem("cameBackFromGame");

  } else if (getState().flowers.length === 0) {

    gardenSpeech("oh your garden looks so empty");

  }

  setupPlanting();

  setupFlowerEditing();

  createRainDrops();
}

function setupPlanting() {

  const field = document.getElementById("gardenField");

  if (!field) {
    return;
  }

  const pending = sessionStorage.getItem("pendingFlower");

  if (!pending) {
    return;
  }

  const data = JSON.parse(pending);

  field.classList.add("ready-to-plant");

  gardenSpeech("click anywhere in the garden to plant it!");

  function placeFlower(event) {

    if (
      event.target.closest(
        ".planted-flower, .flower-edit-panel, .guide-character"
      )
    ) {
      return;
    }

    const rect = field.getBoundingClientRect();

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    x = Math.max(35, Math.min(rect.width - 35, x));
    y = Math.max(75, Math.min(rect.height - 15, y));

    const state = getState();

    state.flowers.push({
      type: data.type,
      color: data.color,
      x,
      y
    });

    saveState(state);

    sessionStorage.removeItem("pendingFlower");

    field.classList.remove("ready-to-plant");

    field.removeEventListener("click", placeFlower);

    renderFlowers();


    if (
      data.type === "tulip" ||
      data.type === "daisy"
    ) {

      gardenSpeech("omg pulo would love that");

    } else {

      gardenSpeech("wow your garden looks pretty");

    }
  }

  field.addEventListener("click", placeFlower);
}


function renderFlowers() {

  const container = document.getElementById("plantedFlowers");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const state = getState();

  state.flowers.forEach((flower, index) => {

    const plant = document.createElement("div");

    plant.className =
      "planted-flower" +
      (index === selectedFlowerIndex ? " selected" : "");

    plant.style.left = flower.x + "px";
    plant.style.top = flower.y + "px";

    plant.dataset.index = index;

    plant.setAttribute("role", "button");
    plant.setAttribute("tabindex", "0");
    plant.setAttribute(
      "aria-label",
      "planted " + flower.type + " flower"
    );

    let centre = "#e9ad3d";

    if (flower.type === "sunflower") {
      centre = "#916039";
    }

    plant.innerHTML = `
      <span class="plant-stem"></span>
      <span class="plant-leaf left"></span>
      <span class="plant-leaf right"></span>

      <span
        class="planted-head ${flower.type}"
        style="
          --flower-color:${flower.color};
          --flower-centre:${centre};
        "
      ></span>
    `;

    plant.addEventListener("click", event => {
      event.stopPropagation();

      if (movingFlower) {
        return;
      }

      selectFlower(index, plant);
    });

    plant.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        selectFlower(index, plant);
      }
    });

    container.appendChild(plant);
  });
}


function ensureFlowerEditPanel() {

  let panel =
    document.getElementById("flowerEditPanel");

  if (panel) {
    return panel;
  }


  panel = document.createElement("div");

  panel.id = "flowerEditPanel";

  panel.className =
    "flower-edit-panel hidden";


  panel.innerHTML = `

    <button
      type="button"
      id="moveFlowerButton"
    >
      move
    </button>

    <button
      type="button"
      id="removeFlowerButton"
    >
      remove
    </button>

    <button
      type="button"
      id="cancelFlowerButton"
    >
      cancel
    </button>

  `;


  const field =
    document.getElementById("gardenField");


  if (field) {
    field.appendChild(panel);
  }


  panel
    .querySelector("#moveFlowerButton")
    .addEventListener("click", event => {

      event.stopPropagation();

      startMovingFlower();

    });


  panel
    .querySelector("#removeFlowerButton")
    .addEventListener("click", event => {

      event.stopPropagation();

      removeSelectedFlower();

    });


  panel
    .querySelector("#cancelFlowerButton")
    .addEventListener("click", event => {

      event.stopPropagation();

      cancelFlowerEdit();

    });


  return panel;
}


function showFlowerEditPanel(index) {

  window.littleGardenEditingFlower = index;

  ensureFlowerEditPanel()
    .classList
    .remove("hidden");
}


function hideFlowerEditPanel() {

  const panel =
    document.getElementById("flowerEditPanel");


  if (panel) {
    panel.classList.add("hidden");
  }


  window.littleGardenEditingFlower = null;
}


function removeSelectedFlower() {

  const index =
    window.littleGardenEditingFlower;


  if (
    index === null ||
    index === undefined
  ) {
    return;
  }


  const state = getState();

  state.flowers.splice(index, 1);

  saveState(state);


  window.littleGardenMovingFlower = null;

  hideFlowerEditPanel();

  renderFlowers();
}


function startMovingFlower() {

  const index =
    window.littleGardenEditingFlower;


  if (
    index === null ||
    index === undefined
  ) {
    return;
  }


  window.littleGardenMovingFlower = index;

  hideFlowerEditPanel();

  gardenSpeech(
    "click where you want your flower to go!"
  );
}


function cancelFlowerEdit() {

  window.littleGardenMovingFlower = null;

  hideFlowerEditPanel();
}


function setupFlowerEditing() {

  const field =
    document.getElementById("gardenField");


  if (
    !field ||
    field.dataset.flowerEditingReady === "true"
  ) {
    return;
  }


  field.dataset.flowerEditingReady = "true";

  ensureFlowerEditPanel();


  field.addEventListener("click", event => {

    if (
      window.littleGardenMovingFlower === null ||
      window.littleGardenMovingFlower === undefined
    ) {
      return;
    }


    if (
      event.target.closest(
        ".planted-flower, .flower-edit-panel, .guide-character"
      )
    ) {
      return;
    }


    const rect =
      field.getBoundingClientRect();


    let x =
      event.clientX - rect.left;

    let y =
      event.clientY - rect.top;


    x = Math.max(
      35,
      Math.min(
        rect.width - 35,
        x
      )
    );


    y = Math.max(
      75,
      Math.min(
        rect.height - 15,
        y
      )
    );


    const state = getState();

    const index =
      window.littleGardenMovingFlower;


    if (state.flowers[index]) {

      state.flowers[index].x = x;

      state.flowers[index].y = y;

      saveState(state);

    }


    window.littleGardenMovingFlower = null;

    renderFlowers();

  });
}



function setWeather(
  weather,
  announce = true
) {

  const board =
    document.getElementById("gardenBoard");


  if (!board) {
    return;
  }


  board.classList.remove(
    "weather-day",
    "weather-evening",
    "weather-night",
    "weather-rain"
  );


  board.classList.add(
    "weather-" + weather
  );


  document
    .querySelectorAll(".weather-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.weather === weather
      );

    });


  localStorage.setItem(
    "gardenWeather",
    weather
  );


  if (!announce) {
    return;
  }


  if (weather === "evening") {

    gardenSpeech(
      "such a beautiful evening"
    );

  } else if (weather === "night") {

    gardenSpeech(
      " the moon looks beautiful"
    );

  } else if (weather === "rain") {

    gardenSpeech(
      "oh its raining!"
    );

  } else if (weather === "day") {

    gardenSpeech(
      "hiiii"
    );

  }
}


function restoreWeather() {

  setWeather(
    localStorage.getItem(
      "gardenWeather"
    ) || "day",
    false
  );

}



function renderModalFlower(
  type,
  color
) {

  const stage =
    document.getElementById(
      "modalFlowerStage"
    );


  if (!stage) {
    return;
  }


  let head = "";


  if (type === "tulip") {

    head = `
      <span
        class="tulip-head"
        style="--flower-color:${color}"
      ></span>
    `;

  }


  else if (type === "rose") {

    head = `
      <span
        class="rose-head"
        style="--flower-color:${color}"
      ></span>
    `;

  }


  else if (
    type === "daisy" ||
    type === "cosmos" ||
    type === "sunflower"
  ) {

    head = `

      <span
        class="${type}-head modal-real-head"
        style="--flower-color:${color}"
      >

        <i></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>

        <b></b>

      </span>

    `;

  }


  else {

    head = `

      <span
        class="
          lavender-bloom
          bloom-a
          modal-lavender-bloom
        "
        style="--flower-color:${color}"
      >

        <i></i>
        <i></i>
        <i></i>
        <i></i>

      </span>


      <span
        class="
          lavender-bloom
          bloom-b
          modal-lavender-bloom
        "
        style="--flower-color:${color}"
      >

        <i></i>
        <i></i>
        <i></i>
        <i></i>

      </span>


      <span
        class="
          lavender-bloom
          bloom-c
          modal-lavender-bloom
        "
        style="--flower-color:${color}"
      >

        <i></i>
        <i></i>
        <i></i>
        <i></i>

      </span>

    `;

  }


  stage.innerHTML = `

    <div
      class="
        flower-preview
        ${type}-preview
        modal-flower-preview
      "
    >

      <span
        class="
          ${type === "lavender"
            ? "lavender-stem"
            : "flower-stem"}
        "
      ></span>


      <span
        class="leaf leaf-left"
      ></span>


      <span
        class="leaf leaf-right"
      ></span>


      ${head}

    </div>

  `;
}


function exitGame() {

  gameEnded = true;

  clearInterval(gameTimer);

  location.href = "games.html";
}


function setupPetalGame() {

  timeLeft = 25;

  setStageMessage(
    "catch the drifting petals!"
  );


  const area =
    document.getElementById("gameArea");


  area.innerHTML = `

    <div
      class="petal-board"
      id="petalBoard"
    >

      <div
        class="petal-basket"
        id="petalBasket"
        aria-hidden="true"
      >

        <span
          class="basket-handle"
        ></span>

        <span
          class="basket-body"
        ></span>

      </div>

    </div>

  `;


  const board =
    document.getElementById(
      "petalBoard"
    );


  let petalSpawner =
    setInterval(() => {

      if (gameEnded) {

        clearInterval(
          petalSpawner
        );

        return;

      }

      spawnCatchPetal(board);

    }, 700);

}



function setupGamePage() {

  const params =
    new URLSearchParams(
      location.search
    );


  currentGame =
    params.get("game") ||
    "memory";


  score = 0;

  gameEnded = false;


  document
    .getElementById("score")
    .textContent = "0";


  if (currentGame === "memory") {

    timeLeft = 40;

  } else if (
    currentGame === "fireflies"
  ) {

    timeLeft = 30;

  } else if (
    currentGame === "petals"
  ) {

    timeLeft = 25;

  } else {

    timeLeft = 30;

  }


  document
    .getElementById("timer")
    .textContent = timeLeft;


  const exitButton =
    document.querySelector(
      ".play-header .small-button"
    );


  if (exitButton) {

    exitButton.textContent =
      "exit";

    exitButton.onclick =
      exitGame;

  }


  setupStageGuide();


  if (currentGame === "memory") {
    setupMemoryGame();
  }


  if (currentGame === "fireflies") {
    setupFireflyGame();
  }


  if (currentGame === "petals") {
    setupPetalGame();
  }


  if (currentGame === "colour") {
    setupColourGame();
  }


  startGameTimer();

}


const LITTLE_GARDEN_SPEECH = {
  general: [
    "your garden is looking so cute",
    "i love it here hehe",
    "look at all the pretty flowers",
    "this little garden feels so cozy",
    "hehe we're growing things together",
    "you've been taking such good care of this place",
    "our tiny garden is getting prettier"
  ],
  moved: [
    "that looks perfect there",
    "aww, i like it there",
    "such a cute little spot",
    "there we go hehe"
  ]
};

function gardenSpeech(text) {
  const speech = document.getElementById("guideSpeech");
  if (!speech) return;
  clearTimeout(window.littleGardenSpeechTimer);
  speech.textContent = text;
  
}

function randomGardenLine(group = "general") {
  const lines = LITTLE_GARDEN_SPEECH[group] || LITTLE_GARDEN_SPEECH.general;
  return lines[Math.floor(Math.random() * lines.length)];
}

function setupGardenGuide() {
  const avatar = document.getElementById("gardenGuideAvatar");
  if (!avatar) return;

  const guide = getGuide();
  avatar.className = "garden-guide-avatar " + guide + "-avatar";
  avatar.innerHTML = `<div class="guide-clone">${createGuideMarkup(guide)}</div>`;

  const character = document.querySelector(".guide-character");
  if (character && character.dataset.guideReady !== "true") {
    character.dataset.guideReady = "true";
    character.addEventListener("click", event => {
      event.stopPropagation();
      gardenSpeech("ohh hi there hehe<3");
    });
  }
}

function setupGarden() {
  const field = document.getElementById("gardenField");
  if (!field) return;

  updateCoinDisplays();
  setupGardenGuide();
  renderFlowers();

  const firstVisit = sessionStorage.getItem("gardenFirstVisit");
  const cameBack = sessionStorage.getItem("cameBackFromGame");

  if (firstVisit === "true") {
    gardenSpeech("hii, how are youu<3");
    sessionStorage.removeItem("gardenFirstVisit");
  } else if (cameBack === "true") {
    gardenSpeech("hey you came back!");
    sessionStorage.removeItem("cameBackFromGame");
  } else if (getState().flowers.length === 0) {
    gardenSpeech("oh your garden looks so empty");
  } else {
    gardenSpeech(randomGardenLine());
  }

  setupPlanting();
  setupFlowerEditing();
  createRainDrops();
}

function flowerMarkup(type, color, extra = "") {
  const centre = type === "sunflower" ? "#916039" : "#e9ad3d";

  let bloom = "";

  if (type === "tulip") {
    bloom = `
      <span class="uf-tulip-petal uf-p1"></span>
      <span class="uf-tulip-petal uf-p2"></span>
      <span class="uf-tulip-petal uf-p3"></span>
    `;
  } else if (type === "rose") {
    bloom = `
      <span class="uf-rose-petal uf-p1"></span>
      <span class="uf-rose-petal uf-p2"></span>
      <span class="uf-rose-petal uf-p3"></span>
      <span class="uf-rose-centre"></span>
    `;
  } else if (type === "lavender") {
    bloom = `
      <span class="uf-lavender-buds">
        <i></i><i></i><i></i><i></i><i></i><i></i>
        <b></b><b></b>
      </span>
    `;
  } else {
    bloom = `
      <span class="uf-round-petals">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        <b></b>
      </span>
    `;
  }

  return `
    <div class="unified-flower ${type} ${extra}" style="--flower-color:${color};--flower-centre:${centre}">
      <span class="uf-stem"></span>
      <span class="uf-leaf uf-left"></span>
      <span class="uf-leaf uf-right"></span>
      ${bloom}
    </div>
  `;
}

function renderFlowers() {
  const container = document.getElementById("plantedFlowers");
  if (!container) return;

  container.innerHTML = "";
  const state = getState();
  const editing = window.littleGardenEditingFlower;

  state.flowers.forEach((flower, index) => {
    const plant = document.createElement("div");
    plant.className = "planted-flower" + (index === editing ? " selected" : "");
    plant.style.left = flower.x + "px";
    plant.style.top = flower.y + "px";
    plant.dataset.index = index;
    plant.setAttribute("role", "button");
    plant.setAttribute("tabindex", "0");
    plant.setAttribute("aria-label", "planted " + flower.type + " flower");
    plant.innerHTML = flowerMarkup(flower.type, flower.color);

    plant.addEventListener("click", event => {
      event.stopPropagation();
      if (window.littleGardenMovingFlower !== null && window.littleGardenMovingFlower !== undefined) return;
      showFlowerEditPanel(index);
    });

    plant.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        showFlowerEditPanel(index);
      }
    });

    container.appendChild(plant);
  });
}

function showFlowerEditPanel(index) {
  window.littleGardenEditingFlower = index;
  const panel = ensureFlowerEditPanel();
  panel.classList.remove("hidden");

  const flower = getState().flowers[index];
  const plant = document.querySelector(`.planted-flower[data-index="${index}"]`);
  if (flower && plant) {
    const field = document.getElementById("gardenField");
    const fieldRect = field.getBoundingClientRect();
    const plantRect = plant.getBoundingClientRect();
    panel.style.left = Math.max(8, Math.min(fieldRect.width - 205, plantRect.left - fieldRect.left - 35)) + "px";
    panel.style.top = Math.max(8, plantRect.top - fieldRect.top - 55) + "px";
  }
}

function hideFlowerEditPanel() {
  const panel = document.getElementById("flowerEditPanel");
  if (panel) panel.classList.add("hidden");
  window.littleGardenEditingFlower = null;
}

function removeSelectedFlower() {
  const index = window.littleGardenEditingFlower;
  if (index === null || index === undefined) return;

  const state = getState();
  state.flowers.splice(index, 1);
  saveState(state);
  window.littleGardenMovingFlower = null;
  hideFlowerEditPanel();
  renderFlowers();
  gardenSpeech(state.flowers.length ? "your garden is looking pretty" : "oh your garden looks so empty");
}

function startMovingFlower() {
  const index = window.littleGardenEditingFlower;
  if (index === null || index === undefined) return;

  window.littleGardenMovingFlower = index;
  hideFlowerEditPanel();
  gardenSpeech("click where you want your flower to go!");
}

function cancelFlowerEdit() {
  window.littleGardenMovingFlower = null;
  hideFlowerEditPanel();
}

function ensureFlowerEditPanel() {
  let panel = document.getElementById("flowerEditPanel");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "flowerEditPanel";
  panel.className = "flower-edit-panel hidden";
  panel.innerHTML = `
    <button type="button" id="moveFlowerButton">move</button>
    <button type="button" id="removeFlowerButton">remove</button>
    <button type="button" id="cancelFlowerButton">cancel</button>
  `;

  document.getElementById("gardenField")?.appendChild(panel);

  panel.querySelector("#moveFlowerButton").addEventListener("click", event => {
    event.stopPropagation();
    startMovingFlower();
  });
  panel.querySelector("#removeFlowerButton").addEventListener("click", event => {
    event.stopPropagation();
    removeSelectedFlower();
  });
  panel.querySelector("#cancelFlowerButton").addEventListener("click", event => {
    event.stopPropagation();
    cancelFlowerEdit();
  });

  return panel;
}

function setupFlowerEditing() {
  const field = document.getElementById("gardenField");
  if (!field || field.dataset.flowerEditingReady === "true") return;

  field.dataset.flowerEditingReady = "true";
  ensureFlowerEditPanel();

  field.addEventListener("click", event => {
    const index = window.littleGardenMovingFlower;
    if (index === null || index === undefined) return;

    if (event.target.closest(".planted-flower, .flower-edit-panel, .guide-character")) return;

    const rect = field.getBoundingClientRect();
    const x = Math.max(35, Math.min(rect.width - 35, event.clientX - rect.left));
    const y = Math.max(75, Math.min(rect.height - 15, event.clientY - rect.top));
    const state = getState();

    if (state.flowers[index]) {
      state.flowers[index].x = x;
      state.flowers[index].y = y;
      saveState(state);
    }

    window.littleGardenMovingFlower = null;
    renderFlowers();
    gardenSpeech(randomGardenLine("moved"));
  });
}

function setupPlanting() {
  const field = document.getElementById("gardenField");
  if (!field || field.dataset.plantingReady === "true") return;

  const pending = sessionStorage.getItem("pendingFlower");
  if (!pending) return;

  let data;
  try {
    data = JSON.parse(pending);
  } catch {
    sessionStorage.removeItem("pendingFlower");
    return;
  }

  field.dataset.plantingReady = "true";
  field.classList.add("ready-to-plant");
  gardenSpeech("click anywhere in the garden to plant it!");

  function placeFlower(event) {
    if (event.target.closest(".planted-flower, .flower-edit-panel, .guide-character")) return;

    const rect = field.getBoundingClientRect();
    const x = Math.max(35, Math.min(rect.width - 35, event.clientX - rect.left));
    const y = Math.max(75, Math.min(rect.height - 15, event.clientY - rect.top));
    const state = getState();

    state.flowers.push({ type: data.type, color: data.color, x, y });
    saveState(state);
    sessionStorage.removeItem("pendingFlower");
    field.classList.remove("ready-to-plant");
    field.removeEventListener("click", placeFlower);
    field.dataset.plantingReady = "false";
    renderFlowers();

    if (data.type === "tulip" || data.type === "daisy") {
      gardenSpeech("omg pulo would love that");
    } else {
      gardenSpeech("wow your garden looks pretty");
    }
  }

  field.addEventListener("click", placeFlower);
}

function setupStageGuide() {
  const guide = document.getElementById("stageGuide");
  if (!guide) return;
  const type = getGuide();
  guide.className = "stage-guide " + type + "-avatar";
  guide.innerHTML = `<div class="guide-clone">${createGuideMarkup(type)}</div>`;
}

function setupShop() {
  updateCoinDisplays();

  const types = ["tulip", "rose", "daisy", "cosmos", "lavender", "sunflower"];
  document.querySelectorAll(".flower-card").forEach((card, index) => {
    const type = types[index];
    const data = flowerData[type];
    const preview = card.querySelector(".flower-preview");
    if (preview && data) {
      preview.innerHTML = flowerMarkup(type, data.colors[0]);
    }
  });
}

function renderModalFlower(type, color) {
  const stage = document.getElementById("modalFlowerStage");
  if (!stage) return;
  stage.innerHTML = flowerMarkup(type, color, "modal-unified-flower");
}

function setWeather(weather, announce = true) {
  const board = document.getElementById("gardenBoard");
  if (!board) return;

  board.classList.remove("weather-day", "weather-evening", "weather-night", "weather-rain");
  board.classList.add("weather-" + weather);

  document.querySelectorAll(".weather-button").forEach(button => {
    button.classList.toggle("active", button.dataset.weather === weather);
  });

  localStorage.setItem("gardenWeather", weather);
  if (!announce) return;

  if (weather === "evening") gardenSpeech("such a beautiful evening");
  else if (weather === "night") gardenSpeech("the moon looks beautiful");
  else if (weather === "rain") gardenSpeech("oh its raining!");
  else gardenSpeech("hiiii");
}

function setupPetalGame() {
  timeLeft = 25;
  setStageMessage("catch the drifting petals!");

  const area = document.getElementById("gameArea");
  if (!area) return;

  area.innerHTML = `
    <div class="petal-board" id="petalBoard">
      <div class="petal-basket" id="petalBasket">
        <span class="basket-handle"></span>
        <span class="basket-body"></span>
      </div>
    </div>
  `;

  const board = document.getElementById("petalBoard");
  const basket = document.getElementById("petalBasket");
  let frames = new Set();
  let spawner = null;

  function moveBasket(event) {
    const rect = board.getBoundingClientRect();
    const x = Math.max(41, Math.min(rect.width - 41, event.clientX - rect.left));
    basket.style.left = x + "px";
  }

  board.addEventListener("pointermove", moveBasket);

  function spawn() {
    if (gameEnded) return;

    const petal = document.createElement("button");
    petal.className = "catch-petal";
    petal.type = "button";
    petal.style.left = Math.random() * 94 + "%";
    petal.style.top = "-45px";
    petal.style.background = ["#ef86aa", "#c59bdc", "#f4c65d", "#f2a58f", "#fff0d8"][Math.floor(Math.random() * 5)];
    board.appendChild(petal);

    const start = performance.now();
    const duration = 2200;

    function fall(now) {
      if (gameEnded) {
        petal.remove();
        frames.delete(id);
        return;
      }

      const progress = (now - start) / duration;
      petal.style.top = progress * 112 + "%";

      const a = petal.getBoundingClientRect();
      const b = basket.getBoundingClientRect();

      if (a.bottom >= b.top && a.left < b.right && a.right > b.left) {
        updateScore(1);
        petal.remove();
        frames.delete(id);
        return;
      }

      if (progress < 1) {
        id = requestAnimationFrame(fall);
        frames.add(id);
      } else {
        petal.remove();
        frames.delete(id);
      }
    }

    let id = requestAnimationFrame(fall);
    frames.add(id);
  }

  spawn();
  spawner = setInterval(spawn, 650);
  window.littleGardenPetalCleanup = () => {
    clearInterval(spawner);
    frames.forEach(cancelAnimationFrame);
    frames.clear();
    board.removeEventListener("pointermove", moveBasket);
  };
}

function endGame() {
  if (gameEnded) return;
  gameEnded = true;
  clearInterval(gameTimer);
  if (window.littleGardenPetalCleanup) {
    window.littleGardenPetalCleanup();
    window.littleGardenPetalCleanup = null;
  }

  let reward = 0;
  if (currentGame === "memory") reward = Math.max(8, score + 4);
  if (currentGame === "fireflies") reward = Math.max(5, score + 3);
  if (currentGame === "petals") reward = Math.max(5, score + 3);
  if (currentGame === "colour") reward = Math.max(6, score + colourLevel);

  addCoins(reward);

  const overlay = document.getElementById("resultOverlay");
  if (!overlay) return;

  document.getElementById("earnedCoins").textContent = reward;
  if (score >= 12) document.getElementById("resultTitle").textContent = "you did amazing";
  else if (score >= 6) document.getElementById("resultTitle").textContent = "good job";
  else document.getElementById("resultTitle").textContent = "nice little try";

  overlay.classList.remove("hidden");
  sessionStorage.setItem("cameBackFromGame", "true");
  document.getElementById("playAgainButton").onclick = () => location.reload();
}

function exitGame() {
  gameEnded = true;
  clearInterval(gameTimer);
  if (window.littleGardenPetalCleanup) {
    window.littleGardenPetalCleanup();
    window.littleGardenPetalCleanup = null;
  }
  sessionStorage.setItem("cameBackFromGame", "true");
  location.href = "garden.html";
}


