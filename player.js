// player.js — 플레이어 이동 및 충돌 판정 구조

class Player {
  constructor(id, startR, startC, keyUp, keyDown, keyLeft, keyRight, initDr, initDc) {
    this.id = id;
    this.r = startR;
    this.c = startC;
    
    // 시작하자마자 멈춰있지 않고 무조건 자동으로 움직이도록 설정
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
    // 180도 즉시 반대 방향 전환 버그 방지
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

    // 규칙 변경: 맵 밖으로 나갈 수 없음 (장외 사망 방지 및 강제 차단)
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      return; 
    }

    this.r = nr;
    this.c = nc;

    const currentTileOwner = getOwner(this.r, this.c);

    // 자신의 땅 위에 도달했을 때
    if (currentTileOwner === this.owner) {
      if (this.tail.length > 0) {
        this.tail.push({ r: this.r, c: this.c });
        fillClosedArea(this.owner, this.tail);
        this.tail = [];
      }
    } else {
      // 내 꼬리를 밟았을 때 처리 (강철꼬리가 아닐 때만 사망)
      if (this.tail.some(t => t.r === this.r && t.c === this.c)) {
        if (this.steelTailTimer <= 0) {
          this.alive = false;
          return;
        }
      }
      this.tail.push({ r: this.r, c: this.c });
    }
  }

  // 자신의 땅에 안전하게 밟고 서 있는지 체크
  isInOwnTerritory() {
    return getOwner(this.r, this.c) === this.owner;
  }

  cutTailAt(index) {
    if (this.steelTailTimer > 0) return; // 강철 꼬리 상태는 무적
    if (this.isInOwnTerritory()) return; // 규칙: 자신의 땅 위에 있을 때는 죽지 않음
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
    this.moveAccum = 0;
  }

  draw(p) {
    if (!this.alive) return;

    // 꼬리 그리기 (줄)
    const tailCol = this.steelTailTimer > 0 ? '#B0BEC5' : this.displayColor;
    p.noStroke();
    for (const t of this.tail) {
      p.fill(tailCol);
      p.rect(t.c * TILE_SIZE + 3, t.r * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6, 2);
    }

    // 플레이어 머리
    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;
    
    if (this.boostTimer > 0) {
      p.fill(0, 255, 255, 80);
      p.rect(x - 2, y - 2, TILE_SIZE + 4, TILE_SIZE + 4, 4);
    }

    p.fill(this.id === 'A' ? COLOR_A : COLOR_B);
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);

    // 눈금선 그리기
    p.fill(255);
    p.rect(x + 4, y + 4, 3, 3);
    p.rect(x + TILE_SIZE - 7, y + 4, 3, 3);
  }
}

let playerA, playerB;

function initPlayers() {
  // 처음 작동 시 자동으로 한 방향으로 전진하게 강제 초기 이동 설정 적용
  playerA = new Player('A', 10, 10, 87, 83, 65, 68, 0, 1);       // WASD 조작
  playerB = new Player('B', ROWS - 11, COLS - 11, 38, 40, 37, 39, 0, -1); // 방향키 조작
}

function updatePlayers(phase, p) {
  playerA.update(phase, p);
  playerB.update(phase, p);

  if (!playerA.alive || !playerB.alive) return;

  // 규칙: 머리끼리 부딪혔을 때는 안 죽고 서로 반사되어 튕겨나감
  if (playerA.r === playerB.r && playerA.c === playerB.c) {
    playerA.r -= playerA.dr; playerA.c -= playerA.dc;
    playerB.r -= playerB.dr; playerB.c -= playerB.dc;
    playerA.nextDr = -playerA.dr; playerA.nextDc = -playerA.dc;
    playerB.nextDr = -playerB.dr; playerB.nextDc = -playerB.dc;
  }

  // 꼬리 교차 끊기 판정 (상대 줄을 끊으면 즉시 처단)
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
