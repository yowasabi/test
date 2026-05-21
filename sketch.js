// =============================================
// sketch.js — 게임의 심장
// =============================================

let phase = PHASE_LOBBY;
let gameTimer = 0;
let betrayalTriggered = false;
let winner = null;

let soloTimer = 0;          
let deadPlayerId = null;    

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(FRAME_RATE);
  textFont('monospace');
  resetGame();
}

function resetGame() {
  initGrid();
  initZombies();
  initPlayers();
  initTiles(this);
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE;
  betrayalTriggered = false;
  winner = null;
  betrayalAnnounceFade = 0;
  soloTimer = 0;
  deadPlayerId = null;
  notifications = [];
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  if (phase === PHASE_LOBBY) { drawLobby(this); return; }

  if (phase === PHASE_END) {
    drawGrid(this); drawZombies(this);
    playerA.draw(this); playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  // 매 프레임 시간 차감 및 관리
  if (gameTimer > 0) {
    gameTimer--;
  }
  const timeLeftSec = gameTimer / FRAME_RATE;

  // 정규 배신 시간 돌입 체크
  if (!betrayalTriggered && phase === PHASE_COOP && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  updateTiles(this);
  updateZombies([playerA, playerB], this);
  playerA.update(playerB, zombies, phase, this);
  playerB.update(playerA, zombies, phase, this);

  _checkEndConditions(timeLeftSec);

  // 화면 드로잉 일괄 처리
  drawGrid(this);
  drawTiles(this);
  drawZombies(this);
  playerA.draw(this); playerB.draw(this);
  drawBetrayalAnnounce(this);
  drawUI(this, phase, timeLeftSec, countTiles());
}

function _triggerBetrayal() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  const pA = playerA.alive ? { r: playerA.r, c: playerA.c } : { r: Math.floor(ROWS/2)-3, c: Math.floor(COLS/2) };
  const pB = playerB.alive ? { r: playerB.r, c: playerB.c } : { r: Math.floor(ROWS/2)+3, c: Math.floor(COLS/2) };
  voronoiSplit(pA, pB);
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  showBetrayalAnnounce(this);
}

function _checkEndConditions(timeLeftSec) {
  if (gameTimer <= 0) { _endGame('timer'); return; }
  if (!playerA.alive && !playerB.alive) { _endGame('both_dead'); return; }

  // [협력 페이즈 중 예외 처리] 한 명 사망 시 서바이벌 솔로 타임 전환 규칙
  if (phase === PHASE_COOP) {
    const aDead = !playerA.alive;
    const bDead = !playerB.alive;

    if (aDead || bDead) {
      phase = PHASE_SOLO;
      deadPlayerId = aDead ? 'A' : 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; 
      showNotification(
        aDead ? 'B' : 'A',
        `P${deadPlayerId} 사망! 20초 버티기 돌입 및 종료 후 강제 배신 전환!`,
        '#FF9800'
      );
    }
  }

  if (phase === PHASE_SOLO) {
    soloTimer--;
    // UI 타이머와 상단 바 동기화를 위해 전체 남은 시간도 동시 강제 재설정 처리 가능
    if (soloTimer <= 0) {
      _reviveDeadPlayer();
    }
  }

  // 배신 페이즈 중 한 명 사망 시 즉시 게임 오버 및 승자 확정
  if (phase === PHASE_BETRAYAL) {
    if (!playerA.alive && playerB.alive) { winner = 'B'; phase = PHASE_END; return; }
    if (!playerB.alive && playerA.alive) { winner = 'A'; phase = PHASE_END; return; }
  }
}

function _reviveDeadPlayer() {
  const midR = Math.floor(ROWS / 2);
  const midC = Math.floor(COLS / 2);

  const survivor = deadPlayerId === 'A' ? playerB : playerA;
  const dead     = deadPlayerId === 'A' ? playerA : playerB;

  const survivorPos = { r: survivor.r, c: survivor.c };
  const deadSpawnR = midR + (deadPlayerId === 'A' ? -4 : 4);
  const deadSpawnC = midC;
  const deadPos = { r: deadSpawnR, c: deadSpawnC };

  // 절반 나누기 규칙: 기존 전체 영역(팀 소유)을 생존자 중심 Voronoi로 강제 배분
  voronoiSplit(deadPos, survivorPos);

  const deadOwner = deadPlayerId === 'A' ? OWNER_A : OWNER_B;
  dead.revive(deadSpawnR, deadSpawnC, deadOwner);
  dead.setPhase(PHASE_BETRAYAL);
  survivor.setPhase(PHASE_BETRAYAL);

  // 긴급 배신 모드 시간(30초)으로 강제 고정 및 싱크 맞춤
  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE;
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  deadPlayerId = null;

  showBetrayalAnnounce(this);
  showNotification('A', '부활 완료! 30초 배신 데스매치 시작!', '#FF5252');
}

function _endGame(reason) {
  phase = PHASE_END;
  const counts = countTiles();
  if (reason === 'timer') {
    if (counts.A > counts.B) winner = 'A';
    else if (counts.B > counts.A) winner = 'B';
    else winner = 'draw';
  } else {
    winner = 'zombie';
  }
}

function keyPressed() {
  if (phase === PHASE_LOBBY && keyCode === 32) { phase = PHASE_COOP; return; }
  if (phase === PHASE_END && (key === 'r' || key === 'R')) { resetGame(); return; }
  if (phase === PHASE_COOP || phase === PHASE_SOLO || phase === PHASE_BETRAYAL) {
    playerA.handleKeyPressed(keyCode);
    playerB.handleKeyPressed(keyCode);
  }
}

function mousePressed() {
  const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
  if (phase === PHASE_END &&
      mouseX > cx-80 && mouseX < cx+80 && mouseY > cy+60 && mouseY < cy+98) {
    resetGame();
  }
  if (phase === PHASE_LOBBY &&
      mouseX > cx-100 && mouseX < cx+100 && mouseY > cy+90 && mouseY < cy+136) {
    phase = PHASE_COOP;
  }
}
