// sketch.js — 게임 루프 핵심 제어 컨트롤러

let phase = PHASE_LOBBY;
let gameTimer = 0; 
let soloTimer = 0;
let deadPlayerId = null;
let winner = null;
let betrayalTriggered = false;

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
  
  gameTimer = GAME_TOTAL_TIME * FRAME_RATE; // 60초 제한 설정
  soloTimer = 0;
  deadPlayerId = null;
  winner = null;
  betrayalTriggered = false;
  phase = PHASE_LOBBY;
}

function draw() {
  background(COLOR_EMPTY);

  if (phase === PHASE_LOBBY) {
    drawLobby(this);
    return;
  }

  if (phase === PHASE_END) {
    drawGrid(this);
    drawTiles(this);
    for (const z of zombies) z.draw(this);
    playerA.draw(this);
    playerB.draw(this);
    drawResultScreen(this, countTiles(), winner);
    return;
  }

  // --- 게임 작동 진행 연산 영역 ---
  gameTimer--;
  let timeLeftSec = gameTimer / FRAME_RATE;

  // 일반 모드에서 시간 소진 시 배신 모드 수동 전개 검사
  if (!betrayalTriggered && phase === PHASE_COOP && timeLeftSec <= BETRAYAL_TRIGGER_TIME) {
    _triggerBetrayal();
  }

  // 독자 생존 솔로 페이즈 한계 시간 실시간 추적 체크
  if (phase === PHASE_SOLO) {
    soloTimer--;
    if (soloTimer <= 0) {
      _resurrectAndBetray();
    }
  }

  // 전반적인 타임 아웃 시 승패 심사 처리
  if (gameTimer <= 0) {
    _endGame('timer');
    return;
  }

  // 업데이트 작동 명령 수행
  updatePlayers(phase, this);
  updateZombies([playerA, playerB], this);
  
  // 아이템 상자 체크 충돌
  checkTilePickup(playerA, phase, this);
  checkTilePickup(playerB, phase, this);

  // 조기 사망자 발생 여부 모니터링 (배신타이머 도래 전 조치용)
  if (phase === PHASE_COOP) {
    if (!playerA.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'A';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; // 남은 시간 30초 단축 제한
      gameTimer = soloTimer; 
      showNotification('B', '팀원 사망! 30초 내에 살아남으십시오!', '#FF9800');
    } else if (!playerB.alive) {
      phase = PHASE_SOLO;
      deadPlayerId = 'B';
      soloTimer = SOLO_TIME_LIMIT * FRAME_RATE; // 남은 시간 30초 단축 제한
      gameTimer = soloTimer;
      showNotification('A', '팀원 사망! 30초 내에 살아남으십시오!', '#FF9800');
    }
  }

  // 플레이어 전멸 상태 판정
  if (!playerA.alive && !playerB.alive && phase !== PHASE_SOLO) {
    _endGame('zombie');
    return;
  }

  // 화면 드로잉 표현부
  drawGrid(this);
  drawTiles(this);
  for (const z of zombies) z.draw(this);
  playerA.draw(this);
  playerB.draw(this);
  
  // 단일 통합 UI 바 렌더링
  drawUI(this, phase, phase === PHASE_SOLO ? soloTimer/FRAME_RATE : gameTimer/FRAME_RATE, countTiles());
  drawBetrayalAnnounce(this);
}

// 20초 남았을 때 정상 배신 모드 진입
function _triggerBetrayal() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);
  voronoiSplit(playerA, playerB);
  showBetrayalAnnounce();
}

// 조기 사후 연장 타임 종료 시 발생하는 긴급 구제 부활 및 강제 배신전 개막
function _resurrectAndBetray() {
  betrayalTriggered = true;
  phase = PHASE_BETRAYAL;
  
  // 양 플레이어 완전 세팅 복원
  playerA.setPhase(PHASE_BETRAYAL);
  playerB.setPhase(PHASE_BETRAYAL);

  if (deadPlayerId === 'A') {
    playerA.revive(10, 10, OWNER_A);
    voronoiSplit(playerA, playerB);
    // 생존 플레이어(B) 영역의 절반 패널티를 부활 플레이어(A)에게 할당 지급
    reallocateHalfTerritory(OWNER_B, OWNER_A);
  } else if (deadPlayerId === 'B') {
    playerB.revive(ROWS - 11, COLS - 11, OWNER_B);
    voronoiSplit(playerA, playerB);
    // 생존 플레이어(A) 영역의 절반 패널티를 부활 플레이어(B)에게 할당 지급
    reallocateHalfTerritory(OWNER_A, OWNER_B);
  }

  deadPlayerId = null;
  gameTimer = EMERGENCY_BETRAYAL_TIME * FRAME_RATE; // 배신 타이머 30초 재충전 부여 설정
  showBetrayalAnnounce();
  showNotification('SYSTEM', '죽은 팀원 부활 및 절반 영토 양도, 배신전 시작!', '#FF1744');
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
  if (phase === PHASE_LOBBY && keyCode === 32) {
    phase = PHASE_COOP;
    return;
  }
  if (phase === PHASE_END && (key === 'r' || key === 'R')) {
    resetGame();
    return;
  }

  // 키보드 입력을 양쪽 조작 객체에 전부 안정적으로 상시 전달 (배신 모드 조작 안 됨 문제 차단)
  if (playerA) playerA.handleKeyPressed(keyCode);
  if (playerB) playerB.handleKeyPressed(keyCode);
}
