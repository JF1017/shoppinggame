const MAX_ITEMS = 10;
const BUDGET = 6;
const ITEM_DATA = {
  carrot_item: { price: 1, imageKey: "carrot", name: "carrot", firstSound: "k", soundCount: 5 },
  cake_item: { price: 2, imageKey: "cake", name: "cake", firstSound: "k", soundCount: 3 },
  cheese_item: { price: 2, imageKey: "cheese", name: "cheese", firstSound: "ch", soundCount: 3 },
  jam_item: { price: 3, imageKey: "jam", name: "jam", firstSound: "j", soundCount: 3 },
  ball_item: { price: 4, imageKey: "basketball", name: "ball", firstSound: "b", soundCount: 3 },
  lamp_item: { price: 5, imageKey: "lamp", name: "lamp", firstSound: "l", soundCount: 4 },
  mug_item: { price: 3, imageKey: "bear", name: "mug", firstSound: "m", soundCount: 3 },
  clip_item: { price: 2, imageKey: "clip", name: "clip", firstSound: "k", soundCount: 4 }
};

const MISSIONS = [
  {
    text: "Buy something that begins with /k/.",
    speechText: "Buy something that begins with the k sound.",
    success: "Good match. That word begins with /k/.",
    hint: "Look for a word that starts with the /k/ sound.",
    test: (item) => item.firstSound === "k"
  },
  {
    text: "Buy something with 3 sounds.",
    speechText: "Buy something with three sounds.",
    success: "Good listening. That word has 3 sounds.",
    hint: "Open Sound clues and count the sounds.",
    test: (item) => item.soundCount === 3
  },
  {
    text: "Buy something with 4 sounds and stay within budget.",
    speechText: "Buy something with four sounds and stay within budget.",
    success: "List complete. Now add the prices and check your total.",
    hint: "Find a 4-sound word, then check if its price fits the budget.",
    test: (item) => item.soundCount === 4
  }
];

let currentSlot;
let missionIndex;
let total;
let answerHidden = true;
let pictures = [];
let formulaParts = [];
let assets = {};
let sparkleAngle = 0;
let currentUtterance = null;
let availableVoices = [];

function preload() {
  assets.carrot = loadImage("images/carrot.png");
  assets.basketball = loadImage("images/basketball.png");
  assets.cheese = loadImage("images/cheese.png");
  assets.iceCream = loadImage("images/ice_cream.png");
  assets.shirt = loadImage("images/shirt.png");
  assets.slippers = loadImage("images/slippers.png");
  assets.bear = loadImage("images/bear.png");
  assets.apple = loadImage("images/apple.png");
  assets.cake = loadImage("images/cake.png");
  assets.jam = loadImage("images/jam.png");
  assets.lamp = loadImage("images/lamp.png");
  assets.clip = loadImage("images/clip.png");
  assets.bg = loadImage("images/shoppingcart.jpg");
}

function setup() {
  const canvasWidth = getCanvasWidth();
  const c = createCanvas(canvasWidth, canvasWidth * 0.66);
  c.parent("#canvas_container");
  c.id("myCanvas");
  imageMode(CENTER);

  currentSlot = 0;
  missionIndex = 0;
  total = 0;
  prepareSpeechVoices();
  updateInterface();
}

function draw() {
  drawCartScene();

  for (let i = 0; i < pictures.length; i++) {
    pictures[i].display();
  }

  sparkleAngle += 0.018;
}

function windowResized() {
  const canvasWidth = getCanvasWidth();
  resizeCanvas(canvasWidth, canvasWidth * 0.66);
}

class Picture {
  constructor(slot, graphic) {
    this.slot = slot;
    this.graphic = graphic;
  }

  display() {
    const position = getSlotPosition(this.slot);
    const itemSize = min(width * 0.14, height * 0.22, 92);
    const bounce = sin(frameCount * 0.04 + this.slot) * 2;

    noStroke();
    fill(255, 255, 255, 170);
    ellipse(position.x, position.y + itemSize * 0.42, itemSize * 0.72, itemSize * 0.18);
    image(this.graphic, position.x, position.y + bounce, itemSize, itemSize);
  }
}

function selectFunction(el) {
  const selected = ITEM_DATA[el.value];

  if (!selected || currentSlot >= MAX_ITEMS) {
    setStatusMessage("Your cart is full. Clear the cart to start a new shopping trip.", "warning");
    return;
  }

  const currentMission = MISSIONS[missionIndex];

  if (!currentMission) {
    setStatusMessage("Shopping list complete. Clear the cart to try the mission again.", "success");
    return;
  }

  if (!currentMission.test(selected)) {
    setStatusMessage(`${capitalize(selected.name)} does not match this clue. ${currentMission.hint}`, "warning");
    return;
  }

  if (total + selected.price > BUDGET) {
    setStatusMessage(`Math check: ${capitalize(selected.name)} costs $${selected.price}. That would make $${total + selected.price}, over the $${BUDGET} budget.`, "warning");
    return;
  }

  currentSlot += 1;
  total += selected.price;
  formulaParts.push(selected.price);
  pictures.push(new Picture(currentSlot, assets[selected.imageKey]));
  missionIndex += 1;
  setStatusMessage(`${currentMission.success} Added ${selected.name} for $${selected.price}.`, "success");
  updateInterface();
}

function showAnswer() {
  answerHidden = !answerHidden;
  updateInterface();
}

function clearItems() {
  pictures = [];
  formulaParts = [];
  total = 0;
  currentSlot = 0;
  missionIndex = 0;
  answerHidden = true;
  setStatusMessage("Cart cleared. Start with clue 1: choose an item that begins with /k/.", "neutral");
  updateInterface();
}

function speakMission(index) {
  const mission = MISSIONS[index];

  if (!mission) {
    return;
  }

  if (!isSpeechSupported()) {
    setAudioStatus("Audio read-aloud is not available in this browser.", "warning");
    return;
  }

  prepareSpeechVoices();
  window.speechSynthesis.cancel();

  currentUtterance = new window.SpeechSynthesisUtterance(mission.speechText);
  currentUtterance.lang = "en-US";
  currentUtterance.rate = 0.86;
  currentUtterance.pitch = 1.08;

  const voice = getPreferredVoice();

  if (voice) {
    currentUtterance.voice = voice;
  }

  currentUtterance.onstart = () => {
    setAudioStatus(`Reading clue ${index + 1} aloud.`, "neutral");
  };

  currentUtterance.onend = () => {
    currentUtterance = null;
    setAudioStatus("", "neutral");
  };

  currentUtterance.onerror = () => {
    currentUtterance = null;
    setAudioStatus("Audio could not play. Check browser sound settings and try again.", "warning");
  };

  window.speechSynthesis.speak(currentUtterance);
  setScreenReaderStatus(`Reading clue ${index + 1} aloud.`);
}

function isSpeechSupported() {
  return typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";
}

function prepareSpeechVoices() {
  if (!isSpeechSupported()) {
    return;
  }

  availableVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };
}

function getPreferredVoice() {
  if (!availableVoices.length) {
    availableVoices = window.speechSynthesis.getVoices();
  }

  return availableVoices.find((voice) => voice.lang === "en-US") ||
    availableVoices.find((voice) => voice.lang && voice.lang.startsWith("en")) ||
    null;
}

function updateInterface() {
  const formula = document.getElementById("formula");
  const totalPrice = document.getElementById("total_price");
  const answerButton = document.getElementById("show_answer_button");
  const budgetBadge = document.getElementById("budget_badge");
  const feedback = document.getElementById("mission_feedback");

  if (formula) {
    formula.innerHTML = formulaParts.length ? formulaParts.join(" + ") : "Choose an item";
  }

  if (totalPrice) {
    totalPrice.innerHTML = answerHidden ? "?" : total;
  }

  if (answerButton) {
    answerButton.innerHTML = answerHidden ? "Show Answer" : "Hide Answer";
    answerButton.setAttribute("aria-pressed", String(!answerHidden));
  }

  if (budgetBadge) {
    budgetBadge.innerHTML = `Budget left: $${BUDGET - total}`;
  }

  for (let i = 0; i < MISSIONS.length; i++) {
    const missionItem = document.getElementById(`mission_${i}`);

    if (missionItem) {
      missionItem.classList.toggle("is_complete", i < missionIndex);
      missionItem.classList.toggle("is_active", i === missionIndex);
      missionItem.setAttribute("aria-current", i === missionIndex ? "step" : "false");
    }
  }

  if (feedback && missionIndex >= MISSIONS.length) {
    feedback.innerHTML = `Shopping list complete. Total spent: $${total}.`;
    setFeedbackState(feedback, "success");
  } else if (feedback && currentSlot === 0) {
    feedback.innerHTML = "Start with clue 1: choose an item that begins with /k/.";
    setFeedbackState(feedback, "neutral");
  }
}

function setStatusMessage(message, state = "neutral") {
  const status = document.getElementById("status_message");

  setScreenReaderStatus(message);

  const feedback = document.getElementById("mission_feedback");

  if (feedback) {
    feedback.innerHTML = message;
    setFeedbackState(feedback, state);
  }
}

function setScreenReaderStatus(message) {
  const status = document.getElementById("status_message");

  if (status) {
    status.innerHTML = message;
  }
}

function setAudioStatus(message, state = "neutral") {
  const audioStatus = document.getElementById("audio_status");

  if (audioStatus) {
    audioStatus.innerHTML = message;
    audioStatus.classList.toggle("is_warning", state === "warning");
  }
}

function setFeedbackState(feedback, state) {
  feedback.classList.toggle("is_warning", state === "warning");
  feedback.classList.toggle("is_success", state === "success");
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getCanvasWidth() {
  const container = document.getElementById("canvas_container");
  return container ? container.offsetWidth : 600;
}

function getSlotPosition(slot) {
  const column = (slot - 1) % 5;
  const row = floor((slot - 1) / 5);
  const startX = width * 0.18;
  const gapX = width * 0.16;
  const yPositions = [height * 0.38, height * 0.66];

  return {
    x: startX + column * gapX,
    y: yPositions[row]
  };
}

function drawCartScene() {
  background(241, 249, 255);

  noStroke();
  fill(255, 244, 203);
  ellipse(width * 0.17, height * 0.14, width * 0.18, width * 0.18);

  drawShelfPattern();
  drawCartBasket();
  drawCounter();
  drawFloatingShapes();

  if (pictures.length === 0) {
    drawEmptyCartMessage();
  }
}

function drawShelfPattern() {
  stroke(203, 222, 235);
  strokeWeight(max(1, width * 0.003));

  for (let y = height * 0.18; y < height * 0.72; y += height * 0.16) {
    line(width * 0.08, y, width * 0.92, y);
  }

  noStroke();
  fill(255, 132, 111, 75);
  rect(width * 0.73, height * 0.08, width * 0.12, height * 0.08, 8);
  fill(62, 154, 114, 75);
  rect(width * 0.14, height * 0.68, width * 0.13, height * 0.07, 8);
  fill(143, 78, 201, 65);
  rect(width * 0.82, height * 0.55, width * 0.09, height * 0.08, 8);
}

function drawCartBasket() {
  const cartLeft = width * 0.08;
  const cartTop = height * 0.23;
  const cartWidth = width * 0.84;
  const cartHeight = height * 0.5;

  fill(255, 255, 255, 215);
  stroke(35, 50, 65, 52);
  strokeWeight(max(2, width * 0.006));
  quad(
    cartLeft + cartWidth * 0.08,
    cartTop,
    cartLeft + cartWidth * 0.96,
    cartTop,
    cartLeft + cartWidth * 0.84,
    cartTop + cartHeight,
    cartLeft + cartWidth * 0.18,
    cartTop + cartHeight
  );

  stroke(64, 85, 106, 72);
  strokeWeight(max(1.5, width * 0.004));

  for (let i = 1; i < 5; i++) {
    const x = cartLeft + cartWidth * (0.16 + i * 0.15);
    line(x, cartTop + height * 0.03, x - cartWidth * 0.06, cartTop + cartHeight - height * 0.03);
  }

  for (let i = 1; i < 4; i++) {
    const y = cartTop + cartHeight * (i / 4);
    line(cartLeft + cartWidth * 0.13, y, cartLeft + cartWidth * 0.9, y);
  }

  stroke(35, 50, 65, 130);
  strokeWeight(max(4, width * 0.01));
  line(cartLeft + cartWidth * 0.78, cartTop - height * 0.02, cartLeft + cartWidth * 0.98, cartTop - height * 0.12);

  noStroke();
  fill(35, 50, 65);
  circle(cartLeft + cartWidth * 0.25, cartTop + cartHeight + height * 0.07, width * 0.075);
  circle(cartLeft + cartWidth * 0.78, cartTop + cartHeight + height * 0.07, width * 0.075);
  fill(255, 250, 240);
  circle(cartLeft + cartWidth * 0.25, cartTop + cartHeight + height * 0.07, width * 0.038);
  circle(cartLeft + cartWidth * 0.78, cartTop + cartHeight + height * 0.07, width * 0.038);
}

function drawCounter() {
  fill(62, 154, 114);
  noStroke();
  rect(0, height * 0.86, width, height * 0.14);

  fill(255, 250, 240, 120);
  rect(0, height * 0.86, width, height * 0.025);
}

function drawFloatingShapes() {
  noStroke();

  for (let i = 0; i < 7; i++) {
    const x = width * (0.08 + i * 0.14);
    const y = height * (0.1 + 0.035 * sin(sparkleAngle + i));
    const shapeSize = width * 0.012;

    fill(i % 2 === 0 ? color(255, 132, 111, 120) : color(248, 200, 78, 145));
    circle(x, y, shapeSize);
  }
}

function drawEmptyCartMessage() {
  const boxWidth = width * 0.56;
  const boxHeight = height * 0.18;
  const x = width * 0.5 - boxWidth / 2;
  const y = height * 0.43 - boxHeight / 2;

  noStroke();
  fill(255, 255, 255, 230);
  rect(x, y, boxWidth, boxHeight, 8);
  fill(35, 50, 65);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(max(16, width * 0.035));
  text("Pick an item to fill the cart", width * 0.5, height * 0.43);
}
