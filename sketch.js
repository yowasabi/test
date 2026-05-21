// sketch.js

let phase = PHASE_LOBBY;
let gameTimer = 0;
let betrayalTriggered = false;
let winner = null;
let soloTimer = 0;
let deadPlayerId = null;

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(FRAME_RATE);
  resetGame();
}

function resetGame() {
  initGrid();
  initZombies();
  initPlayers();
  initTiles(this);
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE;
  soloTimer = 0;
  deadPlayerId = null;
  winner = null;
  betrayalTriggered = false;
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  if (phase === PHASE_LOBBY) { drawLobby(this); return; }
  if (phase === PHASE_END) {
    drawGrid(this); drawTiles(this); for (const z of zombies) z.draw(this); playerA.draw(this); playerB.draw(this);
    drawResultScreen(this, countTiles(), winner); return;
  }

  gameTimer--;
  let timeLeftSec = gameTimer / FRAME_RATE;

  // 정규 배신 트리거
  if (!betrayalTriggered && phase === PHASE_COOP && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    betrayalTriggered = true;
    phase = PHASE_BETRAYAL;
    playerA.setPhase(PHASE_BETRAYAL); playerB.setPhase(PHASE_BETRAYAL);
    voronoiSplit(playerA, playerB);
    showBetrayalAnnounce(this);
  }

  // [필수 수정] 한 명 사망 시 독자 생존 페이즈 내부 특수 규칙 제어
  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) {
      betrayalTriggered = true; 
      phase = PHASE_BETRAYAL;
      playerA.setPhase(PHASE_BETRAYAL); playerB.setPhase(PHASE_BETRAYAL);
      
      // 제한 시간이 끝나면 죽은 플레이어가 생존자 구역의 절반을 넘겨받고 부활
      if (deadPlayerId === 'A') { 
        playerA.revive(10, 10, OWNER_A); 
        voronoiSplit(playerA, playerB); 
        reallocateHalfTerritory(OWNER_B, OWNER_A); 
      }
      else if (deadPlayerId === 'B') { 
        playerB.revive(ROWS - 11, COLS - 11, OWNER_B); 
        voronoiSplit(playerA, playerB); 
        reallocateHalfTerritory(OWNER_A, OWNER_B); 
      }
      
      deadPlayerId = null;
      gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE; // 부활 즉시 배신 타이머 30초 시작
      showBetrayalAnnounce(this);
    }
  }

  if (gameTimer <= 0) { _endGame('timer'); return; }

  updatePlayers(phase, this);
  updateZombies([playerA, playerB], this);
  checkTilePickup(playerA, phase, this);
  checkTilePickup(playerB, phase, this);

  // [필수 수정] 배신 타이머 전에 사망 시 게임이 터지지 않고 30초 독자 생존 모드로 인계
  if (phase === PHASE_COOP) {
    if (!playerA.alive) { phase = PHASE_SOLO; deadPlayerId = 'A'; soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; gameTimer = soloTimer; }
    else if (!playerB.alive) { phase = PHASE_SOLO; deadPlayerId = 'B'; soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; gameTimer = soloTimer; }
  }

  if (!playerA.alive && !playerB.alive && phase !== PHASE_SOLO) { _endGame('zombie'); return; }

  drawGrid(this);
  drawTiles(this);
  for (const z of zombies) z.draw(this);
  playerA.draw(this);
  playerB.draw(this);
  drawUI(this, phase, phase === PHASE_SOLO ? soloTimer/FRAME_RATE : gameTimer/FRAME_RATE, countTiles());
  drawBetrayalAnnounce(this);
}

function _endGame(reason) {
  phase = PHASE_END;
  const counts = countTiles();
  if (reason === 'timer') {
    // [필수 수정] 타임아웃 종료 시, 더 넓은 영역을 점유한 플레이어가 승리 판정
    if (counts.A > counts.B) winner = 'A';
    else if (counts.B > counts.A) winner = 'B';
    else winner = 'draw';
  } else { winner = 'zombie'; }
}

function keyPressed() {
  if (phase === PHASE_LOBBY && keyCode === 32) { phase = PHASE_COOP; return; }
  if (phase === PHASE_END && (key === 'r' || key === 'R')) { resetGame(); return; }
  if (playerA) playerA.handleKeyPressed(keyCode);
  if (playerB) playerB.handleKeyPressed(keyCode);
}
