// player.js — 플레이어 행동 및 충돌 로직

class Player {
  constructor(id, startR, startC, keyUp, keyDown, keyLeft, keyRight, initDr, initDc) {
    this.id = id;
    this.r = startR;
    this.c = startC;
    
    // 게임 시작 시 정지해 있지 않고 자동으로 움직이도록 설정
    this.dr = initDr;
    this.dc = initDc;
    this.nextDr = initDr;
    this.nextDc = initDc;

    this.keys = { up: keyUp, down: keyDown, left: keyLeft, right: keyRight };

    this.alive = true;
    this.tail = [];
    this.owner = OWNER_TEAM;

    this.boostTimer = 0;
    this.steelTailTimer = 0;
    this.moveAccum = 0;
  }

  get speed() {
    // 에너지드링크 마시면 속도 2배 효과
    return this.boostTimer > 0 ? PLAYER_SPEED * BOOST_MULTIPLIER : PLAYER_SPEED;
  }

  setPhase(phase) {
    this.owner = (phase === PHASE_COOP || phase === PHASE_SOLO) ? OWNER_TEAM
               : (this.id === 'A' ? OWNER_A : OWNER_B);
  }

  handleKeyPressed(kc) {
    // 반대 방향 전환 방지
    if (kc === this.keys.up    && this.dr !== 1)  { this.nextDr = -1; this.nextDc = 0; }
    if (kc === this.keys.down  && this.dr !== -1) { this.nextDr = 1;  this.nextDc = 0; }
    if (kc === this.keys.left  && this.dc !== 1)  { this.nextDr = 0;  this.nextDc = -1; }
    if (kc === this.keys.right && this.dc !== -1) { this.nextDr = 0;  this.nextDc = 1; }
  }

  update(phase, p) {
    if (!this.alive) return;

    if (this.boostTimer > 0) this.boostTimer--;
    if (this.steelTailTimer > 0) this.steelTailTimer--;

    // 프레임 레이트 독립 이동 누적 계산
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(phase, p);
    }
  }

  _step(phase, p) {
    this.dr = this.nextDr;
    this.dc = this.nextDc;

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 맵 밖으로 이탈 불가 처리 (나가지 못하고 벽에 부딪쳐 멈추거나 미끄러짐)
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      // 진행 방향 통제하여 장외 방지
      return; 
    }

    this.r = nr;
    this.c = nc;

    const currentTileOwner = getOwner(this.r, this.c);

    // 본인 영역(팀 혹은 개인)에 진입한 경우
    if (currentTileOwner === this.owner) {
      if (this.tail.length > 0) {
        // 꼬리를 소유지에 이어 안전하게 영역 획득
        this.tail.push({ r: this.r, c: this.c });
        fillClosedArea(this.owner, this.tail);
        this.tail = [];
      }
    } else {
      // 땅 밖에 있을 때만 자취(꼬리)를 남김
      // 이미 내 꼬리가 있는 칸을 다시 밟으면 강철 꼬리가 아닐 때 사망
      if (this.tail.some(t => t.r === this.r && t.c === this.c)) {
        if (this.steelTailTimer <= 0) {
          this.alive = false;
          return;
        }
      }
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  // 내 영역 위에 온전히 서 있는지 확인
  isInOwnTerritory() {
    return getOwner(this.r, this.c) === this.owner;
  }

  // 꼬리가 끊겼을 때의 처리
  cutTailAt(index) {
    if (this.steelTailTimer > 0) return; // 강철 꼬리 상태면 무적
    
    // 자신의 땅 위에 있는 상태일 경우 꼬리 절단으로 인한 사망 절대 면제
    if (this.isInOwnTerritory()) return;

    this.alive = false;
  }

  revive(r, c, owner) {
    this.r = r;
    this.c = c;
    this.dr = 0; this.dc = 1;
    this.nextDr = 0; this.nextDc = 1;
    this.tail = [];
    this.alive = true;
    this.owner = owner;
    this.boostTimer = 0;
    this.steelTailTimer = 0;
  }

  draw(p) {
    if (!this.alive) return;

    // 꼬리(줄) 그리기
    const tailCol = this.steelTailTimer > 0 ? '#B0BEC5' : (this.id === 'A' ? '#64B5F6' : '#BA68C8');
    p.noStroke();
    for (const t of this.tail) {
      p.fill(tailCol);
      p.rect(t.c * TILE_SIZE + 3, t.r * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 2);
    }

    // 플레이어 본체 머리
    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;
    
    // 이펙트 링
    if (this.boostTimer > 0) {
      p.fill(0, 255, 255, 70);
      p.rect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4, 4);
    }

    p.fill(this.id === 'A' ? COLOR_A : COLOR_B);
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);

    // 눈 표시
    p.fill(255);
    p.rect(x + 4, y + 4, 3, 3);
    p.rect(x + TILE_SIZE - 7, y + 4, 3, 3);
  }
}

let playerA, playerB;

function initPlayers() {
  // A키 조작(WASD), B키 조작(방향키) 정상 주입 및 자동 시작 이동 세팅
  playerA = new Player('A', 10, 10, 87, 83, 65, 68, 0, 1);       // W, S, A, D / 우측 시작
  playerB = new Player('B', ROWS - 11, COLS - 11, 38, 40, 37, 39, 0, -1); // 방향키 / 좌측 시작
}

function updatePlayers(phase, p) {
  playerA.update(phase, p);
  playerB.update(phase, p);

  if (!playerA.alive || !playerB.alive) return;

  // 1. 머리끼리 부딪혔을 때 처리 (죽지 않고 튕겨 나감)
  if (playerA.r === playerB.r && playerA.c === playerB.c) {
    playerA.r -= playerA.dr; playerA.c -= playerA.dc;
    playerB.r -= playerB.dr; playerB.c -= playerB.dc;
    playerA.nextDr = -playerA.dr; playerA.nextDc = -playerA.dc;
    playerB.nextDr = -playerB.dr; playerB.nextDc = -playerB.dc;
  }

  // 2. 교차 꼬리 끊기 검사 (먼저 끊은 사람이 승리)
  let cutA = -1, cutB = -1;
  
  // A가 B의 꼬리를 끊었는지 확인
  for (let i = 0; i < playerB.tail.length; i++) {
    if (playerA.r === playerB.tail[i].r && playerA.c === playerB.tail[i].c) {
      cutB = i; break;
    }
  }
  // B가 A의 꼬리를 끊었는지 확인
  for (let i = 0; i < playerA.tail.length; i++) {
    if (playerB.r === playerA.tail[i].r && playerB.c === playerA.tail[i].c) {
      cutA = i; break;
    }
  }

  if (cutB !== -1) playerB.cutTailAt(cutB);
  if (cutA !== -1) playerA.cutTailAt(cutA);
}
