// tile.js — 상자(랜덤박스) 배치 및 아이템 수거 규칙

let boxes = [];

function initTiles(p) {
  boxes = [];
  _placeBoxes(p);
}

function _placeBoxes(p) {
  const types = [BOX_TYPE_MEDICINE, BOX_TYPE_BLOOD, BOX_TYPE_ENERGY];
  
  for (const type of types) {
    let placed = 0;
    while (placed < BOX_COUNT_EACH) {
      const r = Math.floor(p.random(4, ROWS - 5));
      const c = Math.floor(p.random(4, COLS - 5));

      // 중복 위치 스킵
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
    // 요구사항: 픽셀 4칸 크기(2x2 타일)로 대형화 적용하여 쉽게 획득할 수 있도록 설정
    const size = TILE_SIZE * 2; 

    p.stroke(255, 255, 255, 180);
    p.strokeWeight(1);
    
    if (box.type === BOX_TYPE_MEDICINE) p.fill('#00E676');
    else if (box.type === BOX_TYPE_BLOOD) p.fill('#FF1744');
    else p.fill('#00B0FF');

    p.rect(x, y, size, size, 4);

    // 아이콘 출력
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(TILE_SIZE * 1.2);
    p.noStroke();
    p.fill(255);
    
    let label = '💊';
    if (box.type === BOX_TYPE_BLOOD) label = '🩸';
    if (box.type === BOX_TYPE_ENERGY) label = '⚡';
    
    p.text(label, x + TILE_SIZE, y + TILE_SIZE);
  }
}

// 아이템 획득 범위 체크 (2x2 공간 전체 및 근접 타일 포함 넉넉하게 판정)
function checkTilePickup(player, phase, p) {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const box = boxes[i];
    // 2x2 크기 범위 안에 플레이어가 걸쳐있는지 검사
    if ((player.r === box.r || player.r === box.r + 1) && 
        (player.c === box.c || player.c === box.c + 1)) {
      
      _applyBoxEffect(box, player, phase, p);
      boxes.splice(i, 1); // 획득한 박스 소멸
    }
  }
}

function _applyBoxEffect(box, player, phase, p) {
  switch (box.type) {
    case BOX_TYPE_MEDICINE:
      // 약 획득: 주변 영역 보너스 땅 획득
      const currentOwner = (phase === PHASE_COOP || phase === PHASE_SOLO) ? OWNER_TEAM : player.owner;
      for (let dr = -BONUS_LAND_RADIUS; dr <= BONUS_LAND_RADIUS; dr++) {
        for (let dc = -BONUS_LAND_RADIUS; dc <= BONUS_LAND_RADIUS; dc++) {
          const nr = player.r + dr;
          const nc = player.c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            setOwner(nr, nc, currentOwner);
          }
        }
      }
      showNotification(player.id, "보너스땅이 주어지는 약을 먹었다!", "#00E676");
      break;

    case BOX_TYPE_BLOOD:
      // 피 획득: 5초 동안 좀비 속도 급증 폭주
      zombieBloodTimer = ITEM_DURATION; 
      showNotification(player.id, "피를 밟았다 좀비속도가 이제 빨라진다!", "#FF1744");
      break;

    case BOX_TYPE_ENERGY:
      // 에너지드링크 획득: 속도 2배 + 강철꼬리 (5초간 무적)
      player.boostTimer = ITEM_DURATION;
      player.steelTailTimer = ITEM_DURATION;
      showNotification(player.id, "속도와 강철꼬리를 갖는 에너지드링크를 마셨다!", "#00B0FF");
      break;
  }
}
