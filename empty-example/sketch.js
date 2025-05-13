let screen = "home";
let playerX = 50;
let playerY = 300;
let playerSpeed = 2;
let direction = { x: 0, y: 0 };
let goalX, goalY;
let distance = 0;
let meterToWin = 100;
let showTutorial = true;
let prevX, prevY;  // ← 이전 위치 저장용
let goalSet = false;  // 깃발 위치 고정 플래그

let keyMap = {};
let keyOptions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
let lastKeyShuffle = 0;
const keyShuffleInterval = 3000; // 3초마다 키 변경

let currentKey = null;
let keyPressStartTime = 0;
const keyHoldLimit = 1000; // 3초 이상 누르면 멈춤
let returning = false;
let returnStartTime = 0;
let returnDuration = 1000; // 밀려나는 애니메이션 시간 (ms)
let explosionEffect = false;
let explosionStart = 0;

let cookieImgs = [];
let currentFrame = 0;

function preload() {
  cookieImgs[0] = loadImage("../src/img/cookie1.png");
  cookieImgs[1] = loadImage("../src/img/cookie2.png");
  bgImg = loadImage("../src/img/background.png"); // ← 배경 이미지 불러오기
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  shuffleKeys();
  resetLevel1();
}

function draw() {
  image(bgImg, 0, 0, width, height); // ← 배경 이미지 적용

  if (screen === "home") drawHome();
  else if (screen === "level1") drawLevel1();
  else if (screen === "level1Clear") drawLevel1Clear();
}

function drawHome() {
  textSize(48);
  textAlign(CENTER, CENTER);
  text("👾 고통 체험관 👾", width / 2, height / 4);

  drawButton("1단계: 방향키 혼란 달리기", width / 2, height / 2, () => {
    screen = "level1";
    resetLevel1();
  });

  drawButton("2단계: ???", width / 2, height / 2 + 180, () => {
    // 준비중
  });
}

function drawLevel1() {
  if (showTutorial) {
    drawTutorialModal();
    return;
  }

  // 키 섞기
  if (millis() - lastKeyShuffle > keyShuffleInterval) {
    shuffleKeys();
    lastKeyShuffle = millis();
  }

  // 3초 이상 누르면 멈춤
  if (currentKey && millis() - keyPressStartTime > keyHoldLimit) {
    direction = { x: 0, y: 0 };
    currentKey = null;
    keyPressStartTime = 0;
  }

  // 🧨 이펙트 중이면 잠깐 보여주기
  if (explosionEffect) {
    drawExplosion(goalX, goalY);
    if (millis() - explosionStart > 300) {
      explosionEffect = false;
      returning = true;
      returnStartTime = millis();
    }
    return;
  }

  // 🏃 돌아오는 중이면 부드럽게 이동
  if (returning) {
    let t = (millis() - returnStartTime) / returnDuration;
    if (t >= 1) {
      playerX = 50;
      playerY = height / 2;
      returning = false;
    } else {
      playerX = lerp(goalX, 50, t);
      playerY = lerp(goalY, height / 2, t);
    }

    drawCookie(playerX, playerY);
    drawGoal(goalX, goalY);
    return;
  }

  // 정상 이동
  let beforeX = playerX;
  let beforeY = playerY;

  playerX += direction.x * playerSpeed;
  playerY += direction.y * playerSpeed;

  playerX = constrain(playerX, 0, width);
  playerY = constrain(playerY, 100, height - 100);

  let dx = playerX - beforeX;
  let dy = playerY - beforeY;
  distance += sqrt(dx * dx + dy * dy);

  drawCookie(playerX, playerY);
  drawGoal(goalX, goalY);

  fill(0);
  textSize(20);
  textAlign(CENTER);
  text(`총 이동 거리: ${int(distance)} px`, width / 2, 40);
  text(`방향키가 고장났습니다!`, width / 2, 70);

  // 골 도착 판정 (오차 범위 ↑)
  if (dist(playerX, playerY, goalX, goalY) < 80) {
    direction = { x: 0, y: 0 };
    currentKey = null;
    keyPressStartTime = 0;
    distance = 0;

    explosionEffect = true;
    explosionStart = millis();
  }

  drawButton("게임 나가기", width - 200, 50, () => {
    screen = "home";
  });
}

function drawTutorialModal() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  rectMode(CENTER);
  rect(width / 2, height / 2, 600, 300, 20);

  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(20);
  text("방향키가 고장났습니다!\n\n지시된 방향키를 누르면 쿠키가 이동해요.\n키는 3초마다 바뀌고, 3초 이상 누르면 멈춰요!\n\n",
       width / 2, height / 2 - 110);

  // X 버튼
  fill(200, 0, 0);
  ellipse(width / 2 + 280, height / 2 - 130, 30);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("X", width / 2 + 280, height / 2 - 130);

  // 클릭 감지
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
  text("🎉 1단계 클리어! 🎉", width / 2, height / 2 - 60);
  drawButton("홈으로 돌아가기", width / 2, height / 2 + 40, () => {
    screen = "home";
  });
}

function keyPressed() {
  // 이미 방향이 지정되어 있는 동안 새 키가 들어와도 덮어쓰기
  for (let dir in keyMap) {
    if (key === keyMap[dir]) {
      currentKey = key;
      keyPressStartTime = millis();

      if (dir === "left") direction = { x: -1, y: 0 };
      else if (dir === "right") direction = { x: 1, y: 0 };
      else if (dir === "up") direction = { x: 0, y: -1 };
      else if (dir === "down") direction = { x: 0, y: 1 };

      break; // 매핑된 키를 찾으면 더 이상 검사하지 않음
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
  let keys = [...keyOptions];
  keyMap = {
    left: random(keys),
    right: random(keys),
    up: random(keys),
    down: random(keys)
  };
  console.log("🔄 키 매핑 변경:", keyMap);
}

function drawButton(label, x, y, callback) {
  let w = 400;
  let h = 100;
  rectMode(CENTER);
  stroke(0);
  strokeWeight(3);
  fill(255);
  rect(x, y, w, h, 30);

  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
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
  playerY = height / 2;
  direction = { x: 0, y: 0 };
  distance = 0;

  if (!goalSet) {
    goalX = random(width * 0.75, width * 0.95);
    goalY = random(height * 0.3, height * 0.7);
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
    text("🍪 쿠키 로딩 중...", x, y);
  }
}

function drawGoal(x, y) {
  stroke(0);
  strokeWeight(2);
  line(x, y + 50, x, y - 50);
  fill(255, 0, 0);
  triangle(x, y - 50, x + 40, y - 40, x, y - 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawExplosion(x, y) {
  push();
  textAlign(CENTER, CENTER);
  textSize(64);
  fill(255, 0, 0);
  text("💥 펑! 속았지?! 💥", x, y - 80);
  pop();

  drawCookie(x, y);
  drawGoal(goalX, goalY);
}
