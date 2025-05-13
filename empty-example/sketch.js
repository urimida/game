let screen = "home";
let playerX = 50,
  playerY = 300;
let playerSpeed = 2;
let direction = { x: 0, y: 0 };
let goalX, goalY;
let distance = 0;
let showTutorial = true;
let goalSet = false;

let keyMap = {};
let keyOptions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let lastKeyShuffle = 0;
const keyShuffleInterval = 3000;
let currentKey = null;
let keyPressStartTime = 0;
const keyHoldLimit = 1000;

let returning = false;
let returnStartTime = 0;
let returnDuration = 1000;
let explosionEffect = false;
let explosionStart = 0;

let bgImg,
  cookieImgs = [],
  currentFrame = 0,
  goalImg;

function preload() {
  cookieImgs[0] = loadImage("../src/img/cookie1.png");
  cookieImgs[1] = loadImage("../src/img/cookie2.png");
  bgImg = loadImage("../src/img/background.png");
  goalImg = loadImage("../src/img/star.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  shuffleKeys();
  resetLevel1();
}

function draw() {
  clear();
  if (screen === "level1") {
    drawLevel1();
  } else {
    background(230);
    if (screen === "home") drawHome();
    else if (screen === "level1Clear") drawLevel1Clear();
  }
}

function drawHome() {
  textSize(48);
  textAlign(CENTER, CENTER);
  text("고통 체험관", width / 2, height / 4);
  drawButton("1단계: 방향키 혼란 달리기", width / 2, height / 2, () => {
    screen = "level1";
    resetLevel1();
  });
  drawButton("2단계: ???", width / 2, height / 2 + 180, () => {});
}

function drawLevel1() {
  background(0);
  if (bgImg) drawBackgroundCover(bgImg);
  if (showTutorial) {
    drawTutorialModal();
    return;
  }

  if (millis() - lastKeyShuffle > keyShuffleInterval) {
    shuffleKeys();
    lastKeyShuffle = millis();
  }

  if (currentKey && millis() - keyPressStartTime > keyHoldLimit) {
    direction = { x: 0, y: 0 };
    currentKey = null;
    keyPressStartTime = 0;
  }

  if (explosionEffect) {
    if (millis() - explosionStart > 300) {
      explosionEffect = false;
      returning = true;
      returnStartTime = millis();
    }
    return;
  }

  if (returning) {
    let t = (millis() - returnStartTime) / returnDuration;
    if (t >= 1) {
      playerX = 50;
      playerY = height * 0.75;
      returning = false;
    } else {
      playerX = lerp(goalX, 50, t);
      playerY = lerp(goalY, height * 0.75, t);
    }
    drawCookie(playerX, playerY);
    drawGoal(goalX, goalY);
    return;
  }

  let prevX = playerX;
  let prevY = playerY;
  playerX += direction.x * playerSpeed;
  playerY += direction.y * playerSpeed;

  playerX = constrain(playerX, 0, width);
  playerY = constrain(playerY, height / 2, height - 100);

  let dx = playerX - prevX;
  let dy = playerY - prevY;
  distance += sqrt(dx * dx + dy * dy);

  drawCookie(playerX, playerY);
  drawGoal(goalX, goalY);

  fill(0);
  textSize(20);
  textAlign(CENTER);
  text(`총 이동 거리: ${int(distance)} px`, width / 2, 40);
  text(`방향키가 고장났습니다!`, width / 2, 70);

  if (dist(playerX, playerY, goalX, goalY) < 80) {
    direction = { x: 0, y: 0 };
    currentKey = null;
    keyPressStartTime = 0;
    distance = 0;
    explosionEffect = true;
    explosionStart = millis();
  }

  drawButton(
    "나가기",
    width - 80,
    30,
    () => {
      screen = "home";
    },
    100,
    40
  );
}

function drawTutorialModal() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  rectMode(CENTER);
  rect(width / 2, height / 2, 600, 300, 20);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(
    "방향키가 고장났습니다!\n\n지시된 방향키를 누르면 쿠키가 이동해요.\n키는 3초마다 바뀌고, 너무 오래 누르면 멈춰요!",
    width / 2,
    height / 2
  );

  fill(200, 0, 0);
  ellipse(width / 2 + 280, height / 2 - 130, 30);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("X", width / 2 + 280, height / 2 - 130);

  if (
    mouseIsPressed &&
    dist(mouseX, mouseY, width / 2 + 280, height / 2 - 130) < 15
  ) {
    showTutorial = false;
  }
}

function drawLevel1Clear() {
  textSize(48);
  textAlign(CENTER, CENTER);
  text("1단계 클리어!", width / 2, height / 2 - 60);
  drawButton("홈으로 돌아가기", width / 2, height / 2 + 40, () => {
    screen = "home";
  });
}

function keyPressed() {
  for (let dir in keyMap) {
    if (key === keyMap[dir]) {
      direction = { x: 0, y: 0 };
      currentKey = key;
      keyPressStartTime = millis();

      if (dir === "left") direction = { x: -1, y: 0 };
      else if (dir === "right") direction = { x: 1, y: 0 };
      else if (dir === "up") direction = { x: 0, y: -1 };
      else if (dir === "down") direction = { x: 0, y: 1 };

      return;
    }
  }
}

function keyReleased() {
  if (key === currentKey) {
    direction = { x: 0, y: 0 };
    currentKey = null;
    keyPressStartTime = 0;
  }
}

function shuffleKeys() {
  let keys = shuffle([...keyOptions]);
  while (keys.length < 4) keys.push("ArrowUp");
  keyMap = {
    left: keys[0],
    right: keys[1],
    up: keys[2],
    down: keys[3],
  };
  console.log("키 매핑 변경:", keyMap);
}

function drawButton(label, x, y, callback, w = null, h = null) {
  textSize(24);
  let padding = 130;
  let textW = textWidth(label);
  if (w === null) w = textW + padding;
  if (h === null) h = 60;

  rectMode(CENTER);
  stroke(0);
  strokeWeight(3);
  fill(255);
  rect(x, y, w, h, 15);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  text(label, x, y);

  if (
    mouseIsPressed &&
    mouseX > x - w / 2 &&
    mouseX < x + w / 2 &&
    mouseY > y - h / 2 &&
    mouseY < y + h / 2
  ) {
    callback();
  }
}

function resetLevel1() {
  playerX = 50;
  playerY = height * 0.75;
  direction = { x: 0, y: 0 };
  distance = 0;
  if (!goalSet) {
    goalX = random(width * 0.75, width * 0.95);
    goalY = random(height * 0.55, height * 0.95);
    goalSet = true;
  }
  shuffleKeys();
  lastKeyShuffle = millis();
}

function drawCookie(x, y) {
  const img = cookieImgs[currentFrame];
  if (img && img.width > 0 && img.height > 0) {
    imageMode(CENTER);
    const desiredWidth = 200;
    const scale = desiredWidth / img.width;
    const desiredHeight = img.height * scale;
    image(img, x, y, desiredWidth, desiredHeight);

    if (frameCount % 15 === 0) {
      currentFrame = (currentFrame + 1) % cookieImgs.length;
    }
  } else {
    fill(0);
    textAlign(CENTER);
    text("쿠키 로딩 중...", x, y);
  }
}

function drawGoal(x, y) {
  if (goalImg && goalImg.width > 0 && goalImg.height > 0) {
    push();

    // 후광 효과 그리기
    noStroke();
    for (let i = 3; i > 0; i--) {
      let alpha = 50 / i;
      fill(255, 255, 0, alpha); // 노란색 계열, 투명도 점점 줄임
      ellipse(x, y, 120 * i, 120 * i);
    }

    // 별 이미지 그리기
    imageMode(CENTER);
    const scale = 0.1;
    image(goalImg, x, y, goalImg.width * scale, goalImg.height * scale);

    pop();
  } else {
    stroke(0);
    strokeWeight(2);
    line(x, y + 50, x, y - 50);
    fill(255, 0, 0);
    triangle(x, y - 50, x + 40, y - 40, x, y - 30);
  }
}

function drawExplosion(x, y) {
  // 아무 것도 표시하지 않음
}

function drawBackgroundCover(img) {
  const canvasRatio = width / height;
  const imgRatio = img.width / img.height;
  let drawWidth, drawHeight;

  if (canvasRatio > imgRatio) {
    drawWidth = width;
    drawHeight = width / imgRatio;
  } else {
    drawHeight = height;
    drawWidth = height * imgRatio;
  }

  imageMode(CENTER);
  image(img, width / 2, height / 2, drawWidth, drawHeight);
  imageMode(CORNER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
