let bgImage;
let walkSheet;
let stopSheet;
let jumpSheet;
let attackSheet;
let effectImage;
let npcSheet;


// ==================================================
// 遊戲基本設定
// ==================================================

let playerX;
let playerY;

let playerWidth;
let playerHeight;

let playerDirection = 1;
let currentAction = "stop";


// ==================================================
// 背景設定
// ==================================================

let backgroundX = 0;

const backgroundSpeed = 12;
const playerSpeed = 8;

let maxBackgroundMove = 0;

// 背景最後移動方向
// 1：背景向右
// -1：背景向左
let lastBackgroundDirection = 0;


// ==================================================
// NPC 設定
// ==================================================

let npcWorldX;
let npcScreenX;
let npcY;

let npcFrame = 0;
let npcTimer = 0;
let npcSpeed = 6;

let npcWidth;
let npcHeight;


// ==================================================
// 動畫速度
// ==================================================

let walkFrame = 0;
let walkTimer = 0;
let walkSpeed = 6;

let stopFrame = 0;
let stopTimer = 0;
let stopSpeed = 6;

let jumpFrame = 0;
let jumpTimer = 0;
let jumpSpeed = 6;

let attackFrame = 0;
let attackTimer = 0;
let attackSpeed = 5;


// ==================================================
// 跳躍設定
// ==================================================

let jumpStartY;
let jumpHeight;


// ==================================================
// 攻擊設定
// ==================================================

let isAttacking = false;
let showEffect = false;

let effectX;
let effectSpeed = 8;


// ==================================================
// 閃電設定
// ==================================================

let showLightning = false;
let lightningTimer = 0;
let lightningSpeed = 5;
let lightningSeed = 0;


// ==================================================
// 答題設定
// ==================================================

let isQuestionVisible = false;
let questionA;
let questionB;
let correctAnswer;
let answerOptions = [];

let questionFeedback = "";
let feedbackColor;
let feedbackTimer = 0;

let questionWidth;
let questionHeight;


// 防止玩家一直停在 NPC 上重複觸發
let questionReady = true;


// ==================================================
// 載入圖片
// ==================================================

function preload() {
  bgImage = loadImage("picture/bg.png");

  walkSheet = loadImage("picture/walk.png");
  stopSheet = loadImage("picture/stop.png");
  jumpSheet = loadImage("picture/jump.png");
  attackSheet = loadImage("picture/attack.png");

  effectImage = loadImage("picture/0.png");

  npcSheet = loadImage("picture/npc.png");
}


// ==================================================
// 初始化
// ==================================================

function setup() {
  createCanvas(windowWidth, windowHeight);

  imageMode(CENTER);
  textAlign(CENTER, CENTER);

  calculateDisplaySize();

  playerX = width / 2;
  playerY = height - playerHeight / 2;

  effectX = playerX;

  updateBackgroundLimit();

  // NPC 初始位置約在畫面寬度 1/4
  npcScreenX = width / 4;
  npcWorldX = npcScreenX - backgroundX;

  npcY = height - npcHeight / 2;

  generateQuestion();
}


// ==================================================
// 主程式
// ==================================================

function draw() {
  background(128, 128, 128);

  calculateDisplaySize();

  updateNPCPosition();

  drawBackground();
  drawNPC();

  // 更新 NPC 動畫
  playNPCAnimation();

  // 答題期間
  if (isQuestionVisible) {
    drawQuestionPanel();

    // 題目回饋倒數
    if (feedbackTimer > 0) {
      feedbackTimer--;

      if (feedbackTimer <= 0) {
        questionFeedback = "";
        isQuestionVisible = false;
        questionReady = false;
      }
    }

    return;
  }

  // 玩家與 NPC 碰撞檢查
  checkNPCollision();

  // 攻擊期間
  if (isAttacking) {
    showLightning = false;

    playAttackAnimation();

    if (showEffect) {
      drawAttackEffect();
    }

    return;
  }

  // 跳躍期間
  if (currentAction === "jump") {
    showLightning = false;
    playJumpAnimation();

    return;
  }

  // 左右移動
  handleHorizontalMovement();

  // 限制角色位置
  constrainPlayerPosition();

  // 沒有按左右鍵時播放待機動畫
  if (
    !keyIsDown(LEFT_ARROW) &&
    !keyIsDown(RIGHT_ARROW)
  ) {
    currentAction = "stop";
    showLightning = false;

    playStopAnimation();
  }

  // 顯示閃電
  if (showLightning) {
    updateLightning();
    drawLightning();
  }
}


// ==================================================
// 計算顯示大小
// 角色高度為背景顯示高度的 1/3
// ==================================================

function calculateDisplaySize() {
  if (!bgImage) {
    return;
  }

  let backgroundScale =
    width / bgImage.width;

  let displayedBackgroundHeight =
    bgImage.height * backgroundScale;

  // 角色高度為背景顯示高度的 1/3
  playerHeight =
    displayedBackgroundHeight / 3;

  // 依 walk 每格比例計算角色寬度
  let walkFrameWidth =
    walkSheet.width / 9;

  let walkFrameHeight =
    walkSheet.height;

  playerWidth =
    playerHeight *
    walkFrameWidth /
    walkFrameHeight;

  // NPC 高度使用角色高度
  let npcFrameWidth =
    npcSheet.width / 10;

  let npcFrameHeight =
    npcSheet.height;

  npcHeight = playerHeight;

  npcWidth =
    npcHeight *
    npcFrameWidth /
    npcFrameHeight;

  if (
    playerY !== undefined &&
    currentAction !== "jump"
  ) {
    playerY =
      height -
      playerHeight / 2;
  }

  npcY =
    height -
    npcHeight / 2;

  updateBackgroundLimit();
}


// ==================================================
// 更新背景最大移動距離
// ==================================================

function updateBackgroundLimit() {
  let backgroundScale =
    width / bgImage.width;

  let displayedBackgroundWidth =
    bgImage.width * backgroundScale;

  // 背景最多移動顯示寬度的 2 倍
  maxBackgroundMove =
    displayedBackgroundWidth * 2;
}


// ==================================================
// 繪製無縫背景
// ==================================================

function drawBackground() {
  let backgroundScale =
    width / bgImage.width;

  let displayedWidth =
    bgImage.width * backgroundScale;

  let displayedHeight =
    bgImage.height * backgroundScale;

  let wrappedX =
    ((backgroundX % displayedWidth) +
      displayedWidth) %
    displayedWidth;

  for (
    let x = wrappedX - displayedWidth;
    x < width + displayedWidth;
    x += displayedWidth
  ) {
    image(
      bgImage,
      x + displayedWidth / 2,
      height - displayedHeight / 2,
      displayedWidth,
      displayedHeight
    );
  }
}


// ==================================================
// NPC 世界座標與畫面座標
// NPC 跟隨背景一起移動
// ==================================================

function updateNPCPosition() {
  npcScreenX =
    npcWorldX + backgroundX;

  // NPC 循環移動時，若完全離開畫面仍保留世界座標
  // 不需要額外限制
}


// ==================================================
// 繪製 NPC
// ==================================================

function drawNPC() {
  // NPC 完全在畫面外時不繪製
  if (
    npcScreenX + npcWidth / 2 < 0 ||
    npcScreenX - npcWidth / 2 > width
  ) {
    return;
  }

  let frameWidth =
    npcSheet.width / 10;

  let frameHeight =
    npcSheet.height;

  let sourceX =
    npcFrame * frameWidth;

  drawSprite(
    npcSheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    npcScreenX,
    npcY,
    1,
    npcWidth,
    npcHeight
  );
}


// ==================================================
// NPC 動畫
// ==================================================

function playNPCAnimation() {
  npcTimer++;

  if (npcTimer >= npcSpeed) {
    npcTimer = 0;
    npcFrame++;

    if (npcFrame >= 10) {
      npcFrame = 0;
    }
  }
}


// ==================================================
// 玩家與 NPC 碰撞
// ==================================================

function checkNPCollision() {
  let distanceX =
    abs(playerX - npcScreenX);

  let distanceY =
    abs(playerY - npcY);

  let horizontalLimit =
    (playerWidth + npcWidth) / 2;

  let verticalLimit =
    (playerHeight + npcHeight) / 2;

  let touching =
    distanceX < horizontalLimit &&
    distanceY < verticalLimit;

  if (
    touching &&
    questionReady &&
    npcScreenX > -npcWidth &&
    npcScreenX < width + npcWidth
  ) {
    isQuestionVisible = true;
    questionReady = false;

    currentAction = "question";
    showLightning = false;
  }

  // 玩家離開 NPC 後，下一次才可重新觸發
  if (!touching) {
    questionReady = true;
  }
}


// ==================================================
// 處理左右移動
// ==================================================

function handleHorizontalMovement() {
  let movingRight =
    keyIsDown(RIGHT_ARROW);

  let movingLeft =
    keyIsDown(LEFT_ARROW);

  let centerX =
    width / 2;

  // 按右鍵：背景向左移動
  if (movingRight) {
    playerDirection = 1;
    currentAction = "walk";

    // 背景仍可向左移動，且角色在中央或右側
    if (
      backgroundX > -maxBackgroundMove &&
      playerX >= centerX
    ) {
      backgroundX -= backgroundSpeed;

      lastBackgroundDirection = -1;

      // 背景移動時角色維持在中央
      playerX = centerX;

      showLightning = false;
    }

    // 背景到極限，角色向右移動
    else {
      playerX += playerSpeed;

      showLightning = true;
      lightningSeed++;
    }

    playWalkAnimation();
  }

  // 按左鍵：背景向右移動
  else if (movingLeft) {
    playerDirection = -1;
    currentAction = "walk";

    // 背景仍可向右移動，且角色在中央或左側
    if (
      backgroundX < maxBackgroundMove &&
      playerX <= centerX
    ) {
      backgroundX += backgroundSpeed;

      lastBackgroundDirection = 1;

      // 背景移動時角色維持在中央
      playerX = centerX;

      showLightning = false;
    }

    // 背景到極限，角色向左移動
    else {
      playerX -= playerSpeed;

      showLightning = true;
      lightningSeed++;
    }

    playWalkAnimation();
  }

  else {
    showLightning = false;
  }
}


// ==================================================
// 限制角色在畫面內
// ==================================================

function constrainPlayerPosition() {
  let minX =
    playerWidth / 2;

  let maxX =
    width - playerWidth / 2;

  playerX =
    constrain(
      playerX,
      minX,
      maxX
    );
}


// ==================================================
// 行走動畫
// ==================================================

function playWalkAnimation() {
  let frameWidth =
    walkSheet.width / 9;

  let frameHeight =
    walkSheet.height;

  walkTimer++;

  if (walkTimer >= walkSpeed) {
    walkTimer = 0;
    walkFrame++;

    if (walkFrame >= 9) {
      walkFrame = 0;
    }
  }

  let sourceX =
    walkFrame * frameWidth;

  drawSprite(
    walkSheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    playerX,
    playerY,
    playerDirection,
    playerWidth,
    playerHeight
  );
}


// ==================================================
// 待機動畫
// ==================================================

function playStopAnimation() {
  let frameWidth =
    stopSheet.width / 8;

  let frameHeight =
    stopSheet.height;

  stopTimer++;

  if (stopTimer >= stopSpeed) {
    stopTimer = 0;
    stopFrame++;

    if (stopFrame >= 8) {
      stopFrame = 0;
    }
  }

  let sourceX =
    stopFrame * frameWidth;

  drawSprite(
    stopSheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    playerX,
    playerY,
    playerDirection,
    playerWidth,
    playerHeight
  );
}


// ==================================================
// 跳躍動畫
// ==================================================

function playJumpAnimation() {
  let frameWidth =
    jumpSheet.width / 8;

  let frameHeight =
    jumpSheet.height;

  jumpTimer++;

  if (jumpTimer >= jumpSpeed) {
    jumpTimer = 0;
    jumpFrame++;
  }

  if (jumpFrame < 4) {
    let progress =
      (jumpFrame + 1) / 4;

    playerY =
      jumpStartY -
      jumpHeight * progress;
  }

  else if (jumpFrame < 8) {
    let progress =
      (jumpFrame - 4 + 1) / 4;

    playerY =
      jumpStartY -
      jumpHeight * (1 - progress);
  }

  if (jumpFrame >= 8) {
    jumpFrame = 0;
    jumpTimer = 0;

    playerY =
      height -
      playerHeight / 2;

    currentAction = "stop";
  }

  let sourceX =
    jumpFrame * frameWidth;

  drawSprite(
    jumpSheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    playerX,
    playerY,
    playerDirection,
    playerWidth,
    playerHeight
  );
}


// ==================================================
// 攻擊動畫
// ==================================================

function playAttackAnimation() {
  let frameWidth =
    attackSheet.width / 12;

  let frameHeight =
    attackSheet.height;

  attackTimer++;

  if (attackTimer >= attackSpeed) {
    attackTimer = 0;
    attackFrame++;

    // 第 5 張播放完後顯示 picture/0
    if (attackFrame >= 5) {
      showEffect = true;
    }
  }

  if (attackFrame >= 12) {
    attackFrame = 0;
    attackTimer = 0;

    isAttacking = false;
    showEffect = false;
    currentAction = "stop";
  }

  let sourceX =
    attackFrame * frameWidth;

  drawSprite(
    attackSheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    playerX,
    playerY,
    playerDirection,
    playerWidth,
    playerHeight
  );
}


// ==================================================
// 繪製角色或 NPC 精靈
// ==================================================

function drawSprite(
  spriteSheet,
  sourceX,
  sourceY,
  sourceWidth,
  sourceHeight,
  x,
  y,
  direction,
  displayWidth,
  displayHeight
) {
  push();

  translate(x, y);

  if (direction === -1) {
    scale(-1, 1);
  }

  image(
    spriteSheet,
    0,
    0,
    displayWidth,
    displayHeight,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight
  );

  pop();
}


// ==================================================
// 攻擊特效 picture/0
// ==================================================

function drawAttackEffect() {
  let scaleFactor =
    playerHeight /
    attackSheet.height;

  let displayWidth =
    effectImage.width *
    scaleFactor;

  let displayHeight =
    effectImage.height *
    scaleFactor;

  effectX +=
    effectSpeed *
    scaleFactor *
    playerDirection;

  push();

  translate(effectX, playerY);

  if (playerDirection === -1) {
    scale(-1, 1);
  }

  image(
    effectImage,
    0,
    0,
    displayWidth,
    displayHeight
  );

  pop();
}


// ==================================================
// 閃電
// 背景向右停止：左側
// 背景向左停止：右側
// ==================================================

function updateLightning() {
  lightningTimer++;

  if (lightningTimer >= lightningSpeed) {
    lightningTimer = 0;
    lightningSeed++;
  }
}


function drawLightning() {
  let lightningX;

  if (lastBackgroundDirection === 1) {
    lightningX =
      playerWidth * 1.5;
  }

  else if (lastBackgroundDirection === -1) {
    lightningX =
      width - playerWidth * 1.5;
  }

  else {
    return;
  }

  let lightningY =
    height -
    playerHeight * 1.7;

  drawLightningShape(
    lightningX,
    lightningY,
    playerWidth * 0.9,
    playerHeight * 1.5,
    lightningSeed
  );
}


function drawLightningShape(
  x,
  y,
  lightningWidth,
  lightningHeight,
  seed
) {
  randomSeed(seed);

  push();

  strokeWeight(
    max(3, playerHeight * 0.035)
  );

  stroke(255, 255, 80);
  fill(255, 255, 120);

  beginShape();

  vertex(
    x - lightningWidth * 0.15,
    y - lightningHeight / 2
  );

  vertex(
    x + lightningWidth * 0.20,
    y - lightningHeight * 0.12
  );

  vertex(
    x + lightningWidth * 0.02,
    y - lightningHeight * 0.10
  );

  vertex(
    x + lightningWidth * 0.25,
    y + lightningHeight * 0.45
  );

  vertex(
    x - lightningWidth * 0.10,
    y + lightningHeight * 0.08
  );

  vertex(
    x - lightningWidth * 0.30,
    y + lightningHeight * 0.12
  );

  endShape(CLOSE);

  noFill();

  stroke(255, 255, 180, 120);

  strokeWeight(
    max(6, playerHeight * 0.08)
  );

  beginShape();

  vertex(
    x - lightningWidth * 0.15,
    y - lightningHeight * 0.48
  );

  vertex(
    x + lightningWidth * 0.20,
    y - lightningHeight * 0.12
  );

  vertex(
    x + lightningWidth * 0.02,
    y - lightningHeight * 0.10
  );

  vertex(
    x + lightningWidth * 0.25,
    y + lightningHeight * 0.43
  );

  endShape();

  pop();
}


// ==================================================
// 產生個位數加法題
// ==================================================

function generateQuestion() {
  questionA =
    floor(random(0, 10));

  questionB =
    floor(random(0, 10));

  correctAnswer =
    questionA + questionB;

  answerOptions = [];

  // 先放入正確答案
  answerOptions.push(correctAnswer);

  // 產生三個不重複的錯誤答案
  while (answerOptions.length < 4) {
    let wrongAnswer =
      floor(random(0, 19));

    if (
      !answerOptions.includes(wrongAnswer)
    ) {
      answerOptions.push(wrongAnswer);
    }
  }

  // 打亂選項順序
  shuffle(answerOptions, true);
}


// ==================================================
// 繪製題目面板
// ==================================================

function drawQuestionPanel() {
  let panelScale =
    constrain(width / 1200, 0.7, 1.5);

  questionWidth =
    460 * panelScale;

  questionHeight =
    260 * panelScale;

  // 題目位於 NPC 右上方
  let panelX =
    npcScreenX +
    npcWidth / 2 +
    questionWidth / 2;

  let panelY =
    npcY -
    npcHeight / 2 -
    questionHeight / 2;

  // 防止超出右側
  panelX =
    constrain(
      panelX,
      questionWidth / 2 + 10,
      width - questionWidth / 2 - 10
    );

  // 防止超出上方
  panelY =
    constrain(
      panelY,
      questionHeight / 2 + 10,
      height - questionHeight / 2 - 10
    );

  push();

  rectMode(CENTER);

  // 面板
  stroke(40);
  strokeWeight(3);
  fill(255, 250, 220);

  rect(
    panelX,
    panelY,
    questionWidth,
    questionHeight,
    15
  );

  // 題目文字
  noStroke();
  fill(30);

  textSize(28 * panelScale);

  text(
    questionA + " + " + questionB + " = ?",
    panelX,
    panelY - questionHeight * 0.30
  );

  // 四個選項
  let optionWidth =
    questionWidth * 0.38;

  let optionHeight =
    questionHeight * 0.22;

  let positions = [
    [-questionWidth * 0.22, questionHeight * 0.05],
    [ questionWidth * 0.22, questionHeight * 0.05],
    [-questionWidth * 0.22, questionHeight * 0.30],
    [ questionWidth * 0.22, questionHeight * 0.30]
  ];

  for (let i = 0; i < 4; i++) {
    let optionX =
      panelX + positions[i][0];

    let optionY =
      panelY + positions[i][1];

    fill(220, 235, 255);
    stroke(80, 100, 140);
    strokeWeight(2);

    rect(
      optionX,
      optionY,
      optionWidth,
      optionHeight,
      8
    );

    noStroke();
    fill(20);

    textSize(22 * panelScale);

    text(
      (i + 1) + ". " + answerOptions[i],
      optionX,
      optionY
    );
  }

  // 鍵盤提示
  fill(70);

  textSize(16 * panelScale);

  text(
    "請點擊選項或按鍵盤 1～4 作答",
    panelX,
    panelY + questionHeight * 0.47
  );

  // 顯示答題結果
  if (questionFeedback !== "") {
    fill(feedbackColor);

    textSize(24 * panelScale);

    text(
      questionFeedback,
      panelX,
      panelY - questionHeight * 0.06
    );
  }

  pop();
}


// ==================================================
// 滑鼠點擊選項
// ==================================================

function mousePressed() {
  if (!isQuestionVisible) {
    return;
  }

  let index =
    getClickedOptionIndex(mouseX, mouseY);

  if (index !== -1) {
    answerQuestion(index);
  }
}


// ==================================================
// 找出滑鼠點擊哪一個選項
// ==================================================

function getClickedOptionIndex(mx, my) {
  let panelScale =
    constrain(width / 1200, 0.7, 1.5);

  let panelW =
    460 * panelScale;

  let panelH =
    260 * panelScale;

  let panelX =
    npcScreenX +
    npcWidth / 2 +
    panelW / 2;

  let panelY =
    npcY -
    npcHeight / 2 -
    panelH / 2;

  panelX =
    constrain(
      panelX,
      panelW / 2 + 10,
      width - panelW / 2 - 10
    );

  panelY =
    constrain(
      panelY,
      panelH / 2 + 10,
      height - panelH / 2 - 10
    );

  let optionW =
    panelW * 0.38;

  let optionH =
    panelH * 0.22;

  let positions = [
    [-panelW * 0.22, panelH * 0.05],
    [ panelW * 0.22, panelH * 0.05],
    [-panelW * 0.22, panelH * 0.30],
    [ panelW * 0.22, panelH * 0.30]
  ];

  for (let i = 0; i < 4; i++) {
    let optionX =
      panelX + positions[i][0];

    let optionY =
      panelY + positions[i][1];

    let inside =
      mx >= optionX - optionW / 2 &&
      mx <= optionX + optionW / 2 &&
      my >= optionY - optionH / 2 &&
      my <= optionY + optionH / 2;

    if (inside) {
      return i;
    }
  }

  return -1;
}


// ==================================================
// 鍵盤作答
// ==================================================

function keyPressed() {
  // 答題期間只處理 1～4
  if (isQuestionVisible) {
    if (key >= "1" && key <= "4") {
      let index =
        int(key) - 1;

      answerQuestion(index);
    }

    return false;
  }

  // 攻擊期間不接受其他按鍵
  if (isAttacking) {
    return false;
  }

  // A 鍵攻擊
  if (key === "a" || key === "A") {
    isAttacking = true;
    currentAction = "attack";

    attackFrame = 0;
    attackTimer = 0;

    showEffect = false;

    effectX =
      playerX +
      playerDirection *
      playerWidth;

    showLightning = false;

    return false;
  }

  // 上方向鍵跳躍
  if (keyCode === UP_ARROW) {
    if (currentAction !== "jump") {
      currentAction = "jump";

      jumpFrame = 0;
      jumpTimer = 0;

      jumpStartY = playerY;

      jumpHeight =
        playerHeight * 3 / 2;
    }

    showLightning = false;

    return false;
  }

  // 左方向鍵
  if (keyCode === LEFT_ARROW) {
    playerDirection = -1;
    return false;
  }

  // 右方向鍵
  if (keyCode === RIGHT_ARROW) {
    playerDirection = 1;
    return false;
  }
}


// ==================================================
// 判斷答案
// ==================================================

function answerQuestion(index) {
  if (
    index < 0 ||
    index >= answerOptions.length
  ) {
    return;
  }

  let selectedAnswer =
    answerOptions[index];

  if (selectedAnswer === correctAnswer) {
    questionFeedback = "答對了！";
    feedbackColor = color(30, 150, 60);
  } else {
    questionFeedback = "再試一次";
    feedbackColor = color(220, 50, 50);
  }

  feedbackTimer = 60;
}


// ==================================================
// 視窗大小改變
// ==================================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  calculateDisplaySize();
  updateBackgroundLimit();

  playerX =
    constrain(
      playerX,
      playerWidth / 2,
      width - playerWidth / 2
    );

  playerY =
    height -
    playerHeight / 2;

  npcY =
    height -
    npcHeight / 2;
}