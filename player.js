// player.js

class Player {
  constructor(id, startR, startC, keyUp, keyDown, keyLeft, keyRight, initDr, initDc) {
    this.id = id;
    this.r = startR;
    this.c = startC;
    // [필수 수정] 멈춰있지 않고 시작하자마자 자동 이동하도록 초기 방향 주입
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
    return this.boostTimer > 0 ? PLAYER_SPEED * BOOST_MULTIPLIER : PLAYER_SPEED;
  }

  get displayColor() {
    if (this.owner === OWNER_TEAM) return COLOR_TEAM;
    return this.id === 'A' ? COLOR_A : COLOR_B;
  }

  setPhase(phase) {
    this.owner = (phase === PHASE_COOP || phase === PHASE_SOLO) ? OWNER_TEAM
                   : (this.id === 'A' ? OWNER_A : OWNER_B);
  }

  handleKeyPressed(kc) {
    // 배신 타이머 시 대소문자나 WASD 조작키가 먹통되지 않도록 검증 처리 완료
    if (kc === this.keys.up    && this.dr !== 1)  { this.nextDr = -1; this.nextDc = 0; }
    if (kc === this.keys.down  && this.dr !== -1) { this.nextDr = 1;  this.nextDc = 0; }
    if (kc === this.keys.left  && this.dc !== 1)  { this.nextDr = 0;  this.nextDc = -1; }
    if (kc === this.keys.right && this.dc !== -1) { this.nextDr = 0;  this.nextDc = 1; }
  }

  update(phase, p) {
    if (!this.alive) return;
    if (this.boostTimer > 0) this.boostTimer--;
    if (this.steelTailTimer > 0) this.steelTailTimer--;

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

    // [필수 수정] 플레이어가 맵 밖으로 나가서 자살하지 않도록 이동 제한 보정
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      return; 
    }

    this.r = nr;
    this.c = nc;
    const currentTileOwner = getOwner(this.r, this.c);

    // 자신의 기지 영역에 밟고 있을 때의 판정
    if (currentTileOwner === this.owner) {
      if (this.tail.length > 0) {
        this.tail.push({ r: this.r, c: this.c });
        fillClosedArea(this.owner, this.tail);
        this.tail = [];
      }
    } else {
      // 꼬리 충돌 검사
      if (this.tail.some(t => t.r === this.r && t.c === this.c)) {
        if (this.steelTailTimer <= 0) {
          this.alive = false;
          return;
        }
      }
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  isInOwnTerritory() {
    return getOwner(this.r, this.c) === this.owner;
  }

  cutTailAt(index) {
    // [필수 수정] 강철 꼬리(에너지드링크 무적 버프) 상태 혹은 아군 기지 내에선 무조건 면역 보정
    if (this.steelTailTimer > 0) return; 
    if (this.isInOwnTerritory()) return; 
    this.alive = false;
  }

  revive(r, c, owner) {
    this.r = r; this.c = c;
    this.dr = 0; this.dc = 1;
    this.nextDr = 0; this.nextDc = 1;
    this.tail = [];
    this.alive = true;
    this.owner = owner;
    this.boostTimer = 0;
    this.steelTailTimer = 0;
    this.moveAccum = 0;
  }

  draw(p) {
    if (!this.alive) return;
    const tailCol = this.steelTailTimer > 0 ? '#B0BEC5' : this.displayColor;
    p.noStroke();
    for (const t of this.tail) {
      p.fill(tailCol);
      p.rect(t.c * TILE_SIZE + 3, t.r * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 2);
    }

    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;
    if (this.boostTimer > 0) {
      p.fill(0, 255, 255, 80);
      p.rect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4, 4);
    }
    p.fill(this.id === 'A' ? COLOR_A : COLOR_B);
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);
    p.fill(255);
    p.rect(x + 4, y + 4, 3, 3);
    p.rect(x + TILE_SIZE - 7, y + 4, 3, 3);
  }
}

let playerA, playerB;

function initPlayers() {
  // 플레이어 A: WASD 조작 유도 (W:87, S:83, A:65, D:68)
  playerA = new Player('A', 10, 10, 87, 83, 65, 68, 0, 1);       
  // 플레이어 B: 화살표 조작 유도 (UP:38, DOWN:40, LEFT:37, RIGHT:39)
  playerB = new Player('B', ROWS - 11, COLS - 11, 38, 40, 37, 39, 0, -1); 
}

function updatePlayers(phase, p) {
  playerA.update(phase, p);
  playerB.update(phase, p);

  if (!playerA.alive || !playerB.alive) return;

  // [필수 수정] 머리끼리 부딪혔을 때 죽지 않고 한 칸 뒤로 밀려남 처리
  if (playerA.r === playerB.r && playerA.c === playerB.c) {
    playerA.r -= playerA.dr; playerA.c -= playerA.dc;
    playerB.r -= playerB.dr; playerB.c -= playerB.dc;
    playerA.nextDr = -playerA.dr; playerA.nextDc = -playerA.dc;
    playerB.nextDr = -playerB.dr; playerB.nextDc = -playerB.dc;
  }

  // 상호간의 꼬리 끊기 검사 루프
  let cutA = -1, cutB = -1;
  for (let i = 0; i < playerB.tail.length; i++) {
    if (playerA.r === playerB.tail[i].r && playerA.c === playerB.tail[i].c) {
      cutB = i; break;
    }
  }
  for (let i = 0; i < playerA.tail.length; i++) {
    if (playerB.r === playerA.tail[i].r && playerB.c === playerA.tail[i].c) {
      cutA = i; break;
    }
  }
  if (cutB !== -1) playerB.cutTailAt(cutB);
  if (cutA !== -1) playerA.cutTailAt(cutA);
}
