// =============================================
// grid.js — 게임판(바닥 타일) 관리
//   - 타일 초기화
//   - 영역 채우기 (flood fill)
//   - 배신 시 Voronoi 영역 분할
// =============================================

// grid[row][col] = { owner: null|'team'|'A'|'B'|'Z', type: 'normal'|..., dirty: bool }
let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = {
        owner: OWNER_NONE,
        type: typeof TILE_TYPE_NORMAL !== 'undefined' ? TILE_TYPE_NORMAL : 'normal',
        dirty: true,
      };
    }
  }
}

// 타일 소유자 설정 + dirty 플래그
function setOwner(r, c, owner) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (grid[r][c].owner !== owner) {
    grid[r][c].owner = owner;
    grid[r][c].dirty = true;
  }
}

function getOwner(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return grid[r][c].owner;
}

// 전체 타일 렌더링 (dirty 타일만 업데이트)
function drawGrid(p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const col = tileColor(tile.owner);
      p.fill(col);
      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      // 그리드 선
      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      tile.dirty = false;
    }
  }
}

function tileColor(owner) {
  switch (owner) {
    case OWNER_TEAM:   return COLOR_TEAM;
    case OWNER_A:      return COLOR_A;
    case OWNER_B:      return COLOR_B;
    case OWNER_ZOMBIE: return COLOR_ZOMBIE;
    default:           return COLOR_EMPTY;
  }
}

// ── Flood Fill: 꼬리로 둘러싸인 내부 타일을 owner 소유로 채움 ──
function floodFillEnclosed(tailSet, owner, p) {
  const visited = new Set();
  const queue = [];

  // 경계에서 시작하여 외부 탐색
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r === 0 || r === ROWS-1 || c === 0 || c === COLS-1)) {
        const key = `${r},${c}`;
        if (!tailSet.has(key) && grid[r][c].owner === OWNER_NONE && !visited.has(key)) {
          visited.add(key);
          queue.push([r, c]);
        }
      }
    }
  }

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (tailSet.has(key)) continue; 
      if (grid[nr][nc].owner !== OWNER_NONE) continue; 
      visited.add(key);
      queue.push([nr, nc]);
    }
  }

  let filled = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (grid[r][c].owner === OWNER_NONE && !visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
        filled++;
      }
    }
  }
  
  for (const key of tailSet) {
    const [r, c] = key.split(',').map(Number);
    setOwner(r, c, owner);
  }
  return filled;
}

// ── Voronoi 분할 ──
function voronoiSplit(posA, posB) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === OWNER_TEAM) {
        const dA = Math.abs(r - posA.r) + Math.abs(c - posA.c);
        const dB = Math.abs(r - posB.r) + Math.abs(c - posB.c);
        grid[r][c].owner = dA <= dB ? OWNER_A : OWNER_B;
        grid[r][c].dirty = true;
      }
    }
  }
}

// 영역 통계
function countTiles() {
  let counts = { team: 0, A: 0, B: 0, Z: 0, none: 0 };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const o = grid[r][c].owner;
      if (o === OWNER_TEAM) counts.team++;
      else if (o === OWNER_A) counts.A++;
      else if (o === OWNER_B) counts.B++;
      else if (o === OWNER_ZOMBIE) counts.Z++;
      else counts.none++;
    }
  }
  return counts;
}

// 영역 폭탄
function applyAreaBomb(centerR, centerC, owner) {
  for (let r = centerR - BOMB_RADIUS; r <= centerR + BOMB_RADIUS; r++) {
    for (let c = centerC - BOMB_RADIUS; c <= centerC + BOMB_RADIUS; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const dist = Math.abs(r - centerR) + Math.abs(c - centerC);
      if (dist <= BOMB_RADIUS) {
        if (grid[r][c].owner === OWNER_NONE) {
          setOwner(r, c, owner);
        }
      }
    }
  }
}
