// grid.js — 게임판 관리

let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      // [오류 해결] 기존의 TILE_NORMAL_TYPE 오타를 constants.js와 일치하는 TILE_TYPE_NORMAL로 완벽히 수정했습니다.
      grid[r][c] = { owner: OWNER_NONE, type: TILE_TYPE_NORMAL, dirty: true };
    }
  }
}

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

function drawGrid(p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      p.fill(tileColor(tile.owner));
      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

function tileColor(owner) {
  if (owner === OWNER_TEAM) return COLOR_TEAM;
  if (owner === OWNER_A) return COLOR_A;
  if (owner === OWNER_B) return COLOR_B;
  if (owner === OWNER_ZOMBIE) return COLOR_ZOMBIE;
  return COLOR_EMPTY;
}

// 영역 채우기 (Flood Fill / BFS 기반)
function fillClosedArea(owner, tailList) {
  const tailSet = new Set(tailList.map(t => `${t.r},${t.c}`));
  const visited = new Set();
  const queue = [];

  // 가장자리에서 출발하여 소유하지 않은 빈 공간 탐색
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        const key = `${r},${c}`;
        if (grid[r][c].owner !== owner && !tailSet.has(key)) {
          visited.add(key);
          queue.push({ r, c });
        }
      }
    }
  }

  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  while (queue.length > 0) {
    const curr = queue.shift();
    for (let i = 0; i < 4; i++) {
      const nr = curr.r + dr[i];
      const nc = curr.c + dc[i];
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const nKey = `${nr},${nc}`;
        if (!visited.has(nKey) && grid[nr][nc].owner !== owner && !tailSet.has(nKey)) {
          visited.add(nKey);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  // 갇힌 안쪽 공간 소유권 전환
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (grid[r][c].owner !== owner && !visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
      }
    }
  }
}

// Voronoi 분할: 배신 시 팀 영역을 두 플레이어 위치 기준으로 분할
function voronoiSplit(posA, posB) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === OWNER_TEAM) {
        const dA = Math.abs(r-posA.r) + Math.abs(c-posA.c);
        const dB = Math.abs(r-posB.r) + Math.abs(c-posB.c);
        grid[r][c].owner = dA <= dB ? OWNER_A : OWNER_B;
        grid[r][c].dirty = true;
      }
    }
  }
}

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
