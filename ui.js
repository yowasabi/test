// ui.js — 단일 시간 바 및 화면 인포메이션 출력

let notifications = [];

function showNotification(playerId, msg, color) {
  notifications.push({ playerId, msg, color, timer: 90 });
  if (notifications.length > 3) notifications.shift();
}

function drawUI(p, phase, timeLeft, counts) {
  p.push();
  
  // 상단 바 UI 배경판
  const hudH = 45;
  p.noStroke();
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_W, hudH);

  // 1. 단일 점유 시간 배정 바 동적 연출 (실시간 움직임 바 1개 구현)
  const barX = 15;
  const barY = 28;
  const barW = CANVAS_W - 30;
  const barH = 10;
  
  p.fill(50);
  p.rect(barX, barY, barW, barH, 4);

  const totalTiles = ROWS * COLS;
  
  if (phase === PHASE_COOP || phase === PHASE_SOLO) {
    const ratio = counts.team / totalTiles;
    p.fill(COLOR_TEAM);
    p.rect(barX, barY, barW * ratio, barH, 4);
  } else {
    // 배신 단계: A와 B의 땅 비율 분할 표시
    const ratioA = counts.A / totalTiles;
    const ratioB = counts.B / totalTiles;
    p.fill(COLOR_A);
    p.rect(barX, barY, barW * ratioA, barH, 4);
    p.fill(COLOR_B);
    p.rect(barX + (barW * ratioA), barY, barW * ratioB, barH, 4);
  }

  // 텍스트 수치 안내 정보
  p.textSize(12);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  
  let modeName = "협력 모드";
  if (phase === PHASE_SOLO) modeName = "생존 타임어택";
  if (phase === PHASE_BETRAYAL) modeName = "⚠️ 배신전 ⚠️";
  
  p.text(`${modeName} | 남은 시간: ${Math.ceil(timeLeft)}초`, 15, 8);

  // 실시간 알림 피드
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    n.timer--;
    p.fill(n.color);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`[Player ${n.playerId}] ${n.msg}`, CANVAS_W - 15, 8 + (i * 14));
  }
  
  notifications = notifications.filter(n => n.timer > 0);
  p.pop();
}

let betrayalAnnounceFade = 0;
function showBetrayalAnnounce() { betrayalAnnounceFade = 90; }

function drawBetrayalAnnounce(p) {
  if (betrayalAnnounceFade <= 0) return;
  betrayalAnnounceFade--;
  p.push();
  p.fill(255, 23, 68, Math.min(220, betrayalAnnounceFade * 4));
  p.rect(0, CANVAS_H/2 - 40, CANVAS_W, 80);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("⚠ 배신 타이머 발동! ⚠", CANVAS_W / 2, CANVAS_H / 2 - 12);
  p.textSize(14);
  p.text("이제부터 팀원은 적입니다! 더 많은 땅을 차지하세요!", CANVAS_W / 2, CANVAS_H / 2 + 16);
  p.pop();
}

function drawLobby(p) {
  p.background(15, 15, 25);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(COLOR_TEAM);
  p.textSize(36);
  p.text("좀비 영역 전쟁", CANVAS_W / 2, CANVAS_H / 2 - 50);
  p.fill(200);
  p.textSize(16);
  p.text("시작하려면 [ SPACE ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 20);
}

function drawResultScreen(p, counts, winner) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_W, CANVAS_H);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("게임 종료", CANVAS_W / 2, CANVAS_H / 2 - 80);

  p.textSize(18);
  let winText = "";
  if (winner === 'A') winText = "플레이어 A 승리! (파란색)";
  else if (winner === 'B') winText = "플레이어 B 승리! (보라색)";
  else if (winner === 'draw') winText = "무승부! 영토 크기가 동일합니다.";
  else winText = "좀비의 승리! 감염 완료.";

  p.fill(winner === 'A' ? COLOR_A : (winner === 'B' ? COLOR_B : '#FF5252'));
  p.text(winText, CANVAS_W / 2, CANVAS_H / 2 - 20);

  p.fill(255);
  p.textSize(14);
  p.text(`최종 스코어 - A 구역: ${counts.A}칸 | B 구역: ${counts.B}칸`, CANVAS_W / 2, CANVAS_H / 2 + 30);
  p.text("재경기하려면 [ R ] 키를 누르세요", CANVAS_W / 2, CANVAS_H / 2 + 80);
  p.pop();
}
