// ui.js

let notifications = [];

function showNotification(playerId, msg, color) {
  notifications.push({ playerId, msg, color, timer: 90 });
  if (notifications.length > 3) notifications.shift();
}

function drawUI(p, phase, timeLeft, counts) {
  p.push();
  p.noStroke(); p.fill(0, 0, 0, 230);
  p.rect(0, 0, CANVAS_W, 45);

  // [필수 수정] 단 1개로 연결되어 유기적으로 줄어드는 직관적 단독 점유/시간 진행 상황 바
  const barX = 15; const barY = 28; const barW = CANVAS_W - 30; const barH = 10;
  p.fill(50); p.rect(barX, barY, barW, barH, 4);

  const totalTiles = ROWS * COLS;
  if (phase === PHASE_COOP || phase === PHASE_SOLO) {
    p.fill(COLOR_TEAM);
    p.rect(barX, barY, barW * (counts.team / totalTiles), barH, 4);
  } else {
    const ratioA = counts.A / totalTiles; const ratioB = counts.B / totalTiles;
    p.fill(COLOR_A); p.rect(barX, barY, barW * ratioA, barH, 4);
    p.fill(COLOR_B); p.rect(barX + (barW * ratioA), barY, barW * ratioB, barH, 4);
  }

  p.textSize(12); p.fill(255); p.textAlign(p.LEFT, p.TOP);
  let modeName = phase === PHASE_SOLO ? "독자 생존 타임어택" : (phase === PHASE_BETRAYAL ? "⚠️ 배신 서바이벌 ⚠️" : "협력전 모드");
  p.text(`${modeName} | 남은 시간: ${Math.ceil(timeLeft)}초`, 15, 8);

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i]; n.timer--;
    p.fill(n.color); p.textAlign(p.RIGHT, p.TOP);
    p.text(`[P-${n.playerId}] ${n.msg}`, CANVAS_W - 15, 8 + (i * 14));
  }
  notifications = notifications.filter(n => n.timer > 0);
  p.pop();
}

let betrayalAnnounceFade = 0;
function showBetrayalAnnounce(p) { betrayalAnnounceFade = 90; }

function drawBetrayalAnnounce(p) {
  if (betrayalAnnounceFade <= 0) return;
  betrayalAnnounceFade--;
  p.push();
  p.fill(255, 23, 68, Math.min(220, betrayalAnnounceFade * 4));
  p.rect(0, CANVAS_H / 2 - 40, CANVAS_W, 80);
  p.fill(255); p.textAlign(p.CENTER, p.CENTER);
  p.textSize(22); p.text("⚠ 배신 타이머 발동! ⚠", CANVAS_W / 2, CANVAS_H / 2 - 12);
  p.textSize(13); p.text("이제부터 팀원은 적입니다! 더 많은 땅을 차지하세요!", CANVAS_W / 2, CANVAS_H / 2 + 16);
  p.pop();
}

function drawLobby(p) {
  p.background(15, 15, 25);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(COLOR_TEAM); p.textSize(36);
  p.text("좀비 영역 전쟁", CANVAS_W / 2, CANVAS_H / 2 - 50);
  p.fill(200); p.textSize(16);
  p.text("시작하려면 [ SPACE ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 20);
}

function drawResultScreen(p, counts, winner) {
  p.push(); p.fill(0, 0, 0, 220); p.rect(0, 0, CANVAS_W, CANVAS_H);
  p.fill(255); p.textAlign(p.CENTER, p.CENTER); p.textSize(32);
  p.text("게임 종료", CANVAS_W / 2, CANVAS_H / 2 - 80);

  let winText = winner === 'A' ? "플레이어 A 우승! (파란색)" : (winner === 'B' ? "플레이어 B 우승! (보라색)" : (winner === 'draw' ? "무승부! 땅 크기 동일" : "좀비 무리의 승리!"));
  p.fill(winner === 'A' ? COLOR_A : (winner === 'B' ? COLOR_B : '#FF5252'));
  p.textSize(18); p.text(winText, CANVAS_W / 2, CANVAS_H / 2 - 20);

  p.fill(255); p.textSize(14);
  p.text(`A 영역: ${counts.A}칸 | B 영역: ${counts.B}칸`, CANVAS_W / 2, CANVAS_H / 2 + 30);
  p.text("재시작하려면 [ R ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 80);
  p.pop();
}
