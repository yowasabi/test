// =============================================
// zombie.js — 좀비 생성 & 매 프레임 이동 AI
//   - 꼬리 끊기면 사망
//   - 영역 점령 가능
//   - 피 효과 시 속도 증가
// =============================================

// 전역 피 효과 타이머 (좀비 전체에 적용)
let zombieBloodTimer = 0;

class Zombie {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.dr = 0;
    this.dc = 1;
    this.moveAccum = 0;
    this.tail = [];
    this.alive = true;
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  update(players, p) {
    if (!this.alive) return;
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(players, p);
      if (!this.alive) return;
    }
  }

  _step(players, p) {
    // 랜덤 방향 전환
    if (p.random() < ZOMBIE_RANDOM_CHANCE) {
      this._randomDir(p);
    } else {
      let targetR = this.r, targetC = this.c;
      let minDist = Infinity;
      for (const pl of players) {
        if (!pl.alive) continue;
        const targets = pl.tail.length > 0 ? pl.tail : [{ r: pl.r, c: pl.c }];
        for (const t of targets) {
          const d = Math.abs(t.r - this.r) + Math.abs(t.c - this.c);
          if (d < minDist) { minDist = d; targetR = t.r; targetC = t.c; }
        }
      }
      const dr = Math.sign(targetR - this.r);
      const dc = Math.sign(targetC - this.c);
      if (dr !== 0 && dc !== 0) {
        if (p.random() < 0.5) { this.dr = dr; this.dc = 0; }
        else { this.dr = 0; this.dc = dc; }
      } else if (dr !== 0) { this.dr = dr; this.dc = 0; }
        else if (dc !== 0) { this.dr = 0; this.dc = dc; }
        else { this._randomDir(p); }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    // 경계 처리
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p); return;
    }

    // 꼬리 자기 자신 충돌 → 사망
    if (this.tail.some(t => t.r === nr && t.c === nc)) {
      this._die(); return;
    }

    // 꼬리 관리
    const isOnOwned = getOwner(this.r, this.c) === OWNER_ZOMBIE;
    if (isOnOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, OWNER_ZOMBIE, null);
        this.tail = [];
      }
    } else {
      this.tail.push({ r: this.r, c: this.c });
    }

    this.r = nr;
    this.c = nc;
  }

  // 플레이어가 좀비 꼬리를 밟았을 때 → 꼬리 자르고 좀비 사망
  cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      for (let i = idx; i < this.tail.length; i++) {
        setOwner(this.tail[i].r, this.tail[i].c, OWNER_NONE);
      }
      this.tail.splice(idx);
      // 꼬리가 끊기면 좀비 사망
      this._die();
    }
  }

  _die() {
    this.alive = false;
    for (const t of this.tail) setOwner(t.r, t.c, OWNER_NONE);
    this.tail = [];
  }
// =============================================
// zombie.js — 좀비 생성 & 매 프레임 이동 AI
// =============================================

let zombieBloodTimer = 0;

class Zombie {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.dr = 0;
    this.dc = 1;
    this.moveAccum = 0;
    this.tail = [];
    this.alive = true;
  }

  get speed() {
    return zombieBloodTimer > 0 ? ZOMBIE_SPEED_BOOSTED : ZOMBIE_SPEED_NORMAL;
  }

  update(players, p) {
    if (!this.alive) return;
    this.moveAccum += this.speed / FRAME_RATE;
    while (this.moveAccum >= 1) {
      this.moveAccum -= 1;
      this._step(players, p);
      if (!this.alive) return;
    }
  }

  _step(players, p) {
    if (p.random() < ZOMBIE_RANDOM_CHANCE) {
      this._randomDir(p);
    } else {
      let targetR = this.r, targetC = this.c;
      let minDist = Infinity;
      for (const pl of players) {
        if (!pl.alive) continue;
        const targets = pl.tail.length > 0 ? pl.tail : [{ r: pl.r, c: pl.c }];
        for (const t of targets) {
          const d = Math.abs(t.r - this.r) + Math.abs(t.c - this.c);
          if (d < minDist) { minDist = d; targetR = t.r; targetC = t.c; }
        }
      }
      const dr = Math.sign(targetR - this.r);
      const dc = Math.sign(targetC - this.c);
      if (dr !== 0 && dc !== 0) {
        if (p.random() < 0.5) { this.dr = dr; this.dc = 0; }
        else { this.dr = 0; this.dc = dc; }
      } else if (dr !== 0) { this.dr = dr; this.dc = 0; }
        else if (dc !== 0) { this.dr = 0; this.dc = dc; }
        else { this._randomDir(p); }
    }

    const nr = this.r + this.dr;
    const nc = this.c + this.dc;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) {
      this._randomDir(p); return;
    }

    // 좀비가 자기 자신의 꼬리에 충돌 시 사망
    if (this.tail.some(t => t.r === nr && t.c === nc)) {
      this._die(); return;
    }

    // 좀비 영역 점령 시스템 (좀비의 땅 관리)
    const isOnOwned = getOwner(nr, nc) === OWNER_ZOMBIE;
    if (isOnOwned) {
      if (this.tail.length > 0) {
        const tailSet = new Set(this.tail.map(t => `${t.r},${t.c}`));
        floodFillEnclosed(tailSet, OWNER_ZOMBIE, p);
        this.tail = [];
      }
    } else {
      // 본인 땅이 아니면 지나온 자리에 꼬리를 남김
      this.tail.push({ r: this.r, c: this.c });
    }

    this.r = nr;
    this.c = nc;
  }

  // 플레이어가 좀비 꼬리를 밟았을 때 호출되어 정상 사망 처리
  cutTailAt(r, c) {
    const idx = this.tail.findIndex(t => t.r === r && t.c === c);
    if (idx !== -1) {
      this._die();
    }
  }

  _die() {
    this.alive = false;
    this.tail = [];
  }

  _randomDir(p) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const d = dirs[Math.floor(p.random(dirs.length))];
    this.dr = d[0]; this.dc = d[1];
  }

  draw(p) {
    if (!this.alive) return;
    // 좀비 꼬리 그리기
    p.noStroke();
    const tailColor = zombieBloodTimer > 0 ? p.color(200, 0, 0, 160) : p.color(120, 50, 180, 160);
    p.fill(tailColor);
    for (const t of this.tail) {
      p.rect(t.c * TILE_SIZE + 2, t.r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 1);
    }
    // 좀비 본체
    const x = this.c * TILE_SIZE;
    const y = this.r * TILE_SIZE;
    p.fill(zombieBloodTimer > 0 ? '#E53935' : '#AB47BC');
    p.noStroke();
    p.rect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2, 3);
    p.fill(255, 50, 50);
    p.ellipse(x + 4, y + 5, 3, 3);
    p.ellipse(x + TILE_SIZE - 4, y + 5, 3, 3);
  }
}

let zombies = [];

function initZombies() {
  zombies = [];
  zombieBloodTimer = 0;
  const spawnPositions = [
    [4, 4], [4, COLS-5], [ROWS-5, 4], [ROWS-5, COLS-5],
    [Math.floor(ROWS/2), 4], [4, Math.floor(COLS/2)]
  ];
  for (let i = 0; i < Math.min(ZOMBIE_COUNT, spawnPositions.length); i++) {
    zombies.push(new Zombie(spawnPositions[i][0], spawnPositions[i][1]));
  }
}

function updateZombies(players, p) {
  if (zombieBloodTimer > 0) zombieBloodTimer--;
  for (const z of zombies) z.update(players, p);
  for (let i = zombies.length - 1; i >= 0; i--) {
    if (!zombies[i].alive) zombies.splice(i, 1);
  }
}

function drawZombies(p) {
  for (const z of zombies) z.draw(p);
}
