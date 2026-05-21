// grid.js — 게임판 및 땅 영역 관리

let grid = [];

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = { owner: OWNER_NONE };
    }
  }
}

function setOwner(r, c, owner) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  grid[r][c].owner = owner;
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

      // 타일 채우기 색상 결정
      if (tile.owner === OWNER_TEAM) p.fill(76, 175, 80, 180);
      else if (tile.owner === OWNER_A) p.fill(33, 150, 243, 180);
      else if (tile.owner === OWNER_B) p.fill(156, 39, 176, 180);
      else if (tile.owner === OWNER_ZOMBIE) p.fill(121, 85, 72, 140);
      else p.fill(COLOR_EMPTY);

      p.noStroke();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);

      // 격자선 그리기
      p.stroke(COLOR_GRID);
      p.strokeWeight(0.3);
      p.noFill();
      p.rect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

// 안전 구역 내부 채우기 (Flood Fill 기반 기하 알고리즘)
function fillClosedArea(owner, tailList) {
  const tailSet = new Set(tailList.map(t => `${t.r},${t.c}`));
  const visited = new Set();
  const queue = [];

  // 외곽선 경계 타일들을 큐에 삽입하여 외부 영역 탐색
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

  // 외부에 닿지 않은 빈 공간을 모두 소유지로 전환
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (grid[r][c].owner !== owner && !visited.has(key) && !tailSet.has(key)) {
        setOwner(r, c, owner);
      }
    }
  }
}

// 배신 타이머 발동 시: 기존 팀 영역을 A와 B의 거리 기준(Voronoi)으로 반반 분할
function voronoiSplit(posA, posB) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === OWNER_TEAM) {
        const dA = Math.abs(r - posA.r) + Math.abs(c - posA.c);
        const dB = Math.abs(r - posB.r) + Math.abs(c - posB.c);
        grid[r][c].owner = dA <= dB ? OWNER_A : OWNER_B;
      }
    }
  }
}

// 부활 시 땅 반감 기여 기능: 한 플레이어의 영역 수의 절반을 강제로 넘겨줌
function reallocateHalfTerritory(fromId, toId) {
  let targetTiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].owner === fromId) {
        targetTiles.push({ r, c });
      }
    }
  }
  // 무작위 혹은 순차적으로 절반 선택 후 이전
  const halfCount = Math.floor(targetTiles.length / 2);
  for (let i = 0; i < halfCount; i++) {
    grid[targetTiles[i].r][targetTiles[i].c].owner = toId;
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
