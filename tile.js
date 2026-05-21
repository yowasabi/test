// tile.js

let boxes = [];

function initTiles(p) {
  boxes = [];
  const types = [BOX_TYPE_MEDICINE, BOX_TYPE_BLOOD, BOX_TYPE_ENERGY];
  for (const type of types) {
    let placed = 0;
    while (placed < BOX_COUNT_EACH) {
      const r = Math.floor(p.random(4, ROWS - 5));
      const c = Math.floor(p.random(4, COLS - 5));
      if (boxes.some(b => b.r === r && b.c === c)) continue;
      boxes.push({ r, c, type });
      placed++;
    }
  }
}

function drawTiles(p) {
  for (const box of boxes) {
    const x = box.c * TILE_SIZE;
    const y = box.r * TILE_SIZE;
    // [필수 수정] 플레이어가 쉽게 획득할 수 있도록 픽셀 4칸(2x2 타일 스케일)으로 확장 드로우
    const size = TILE_SIZE * 2; 

    p.stroke(255, 255, 255, 200);
    p.strokeWeight(1.5);
    if (box.type === BOX_TYPE_MEDICINE) p.fill('#00E676');
    else if (box.type === BOX_TYPE_BLOOD) p.fill('#FF1744');
    else p.fill('#00B0FF');
    p.rect(x, y, size, size, 4);

    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TILE_SIZE * 1.3);
    p.noStroke(); p.fill(255);
    let label = box.type === BOX_TYPE_MEDICINE ? '💊' : (box.type === BOX_TYPE_BLOOD ? '🩸' : '⚡');
    p.text(label, x + TILE_SIZE, y + TILE_SIZE);
  }
}

function checkTilePickup(player, phase, p) {
  // 2x2 사이즈 박스 전체 격자 영역 충돌 감사 루틴
  for (let i = boxes.length - 1; i >= 0; i--) {
    const box = boxes[i];
    if ((player.r === box.r || player.r === box.r + 1) && (player.c === box.c || player.c === box.c + 1)) {
      _applyBoxEffect(box, player, phase, p);
      boxes.splice(i, 1); 
    }
  }
}

function _applyBoxEffect(box, player, phase, p) {
  switch (box.type) {
    case BOX_TYPE_MEDICINE:
      const currentOwner = (phase === PHASE_COOP || phase === PHASE_SOLO) ? OWNER_TEAM : player.owner;
      for (let dr = -BONUS_LAND_RADIUS; dr <= BONUS_LAND_RADIUS; dr++) {
        for (let dc = -BONUS_LAND_RADIUS; dc <= BONUS_LAND_RADIUS; dc++) {
          const nr = player.r + dr; const nc = player.c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) setOwner(nr, nc, currentOwner);
        }
      }
      showNotification(player.id, "보너스땅 물약 획득!", "#00E676");
      break;
    case BOX_TYPE_BLOOD:
      zombieBloodTimer = ITEM_DURATION; 
      showNotification(player.id, "피 장판 자극! 좀비 폭주!", "#FF1744");
      break;
    case BOX_TYPE_ENERGY:
      player.boostTimer = ITEM_DURATION;
      player.steelTailTimer = ITEM_DURATION;
      showNotification(player.id, "에너지드링크 속도/무적 버프!", "#00B0FF");
      break;
  }
}
