export type GridSize = 5 | 6 | 8 | 10;
export type Coord = [number, number]; // [row, col]

export type ShipDef = {
  id: string;
  size: number;
  cells: Coord[];
};

export type Fleet = ShipDef[];

export type CPUState = {
  mode: 'random' | 'hunt';
  firstHit: Coord | null;
  lastHit: Coord | null;
  currentDir: Coord | null;
  triedDirs: Coord[];
};

const DIRS: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export const getShipSizes = (gridSize: GridSize): number[] => {
  if (gridSize === 5) return [3, 2, 2];
  if (gridSize === 6) return [3, 3, 2, 2];
  if (gridSize === 8) return [4, 3, 3, 2, 2];
  return [5, 4, 3, 3, 2];
};

export const isValidPlacement = (cells: Coord[], otherShips: Fleet, gridSize: GridSize): boolean => {
  for (const [r, c] of cells) {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
    for (const ship of otherShips) {
      for (const [sr, sc] of ship.cells) {
        if (r === sr && c === sc) return false; // Overlap is illegal
      }
    }
  }
  return true;
};

export const generateRandomFleet = (gridSize: GridSize): Fleet => {
  const sizes = getShipSizes(gridSize);
  const fleet: Fleet = [];

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const isVertical = Math.random() < 0.5;
      const r = Math.floor(Math.random() * gridSize);
      const c = Math.floor(Math.random() * gridSize);

      const cells: Coord[] = [];
      for (let j = 0; j < size; j++) {
        cells.push(isVertical ? [r + j, c] : [r, c + j]);
      }

      if (isValidPlacement(cells, fleet, gridSize)) {
        fleet.push({ id: `ship-${i}`, size, cells });
        placed = true;
      }
    }

    if (!placed) {
      return generateRandomFleet(gridSize);
    }
  }
  return fleet;
};

const coordToString = (r: number, c: number) => `${r},${c}`;

export const getNextCPUMove = (
  state: CPUState,
  previousShots: Set<string>,
  gridSize: GridSize
): { move: Coord; newState: CPUState } => {
  const newState = { ...state };

  const isValidTarget = (r: number, c: number) => {
    return r >= 0 && r < gridSize && c >= 0 && c < gridSize && !previousShots.has(coordToString(r, c));
  };

  if (newState.mode === 'hunt' && newState.firstHit) {
    if (newState.currentDir && newState.lastHit) {
      const [dr, dc] = newState.currentDir;
      const r = newState.lastHit[0] + dr;
      const c = newState.lastHit[1] + dc;

      if (isValidTarget(r, c)) {
        return { move: [r, c], newState };
      } else {
        newState.currentDir = null;
        newState.lastHit = newState.firstHit;
      }
    }

    const untried = DIRS.filter(d => !newState.triedDirs.some(td => td[0] === d[0] && td[1] === d[1]));

    if (untried.length > 0) {
      const dir = untried[Math.floor(Math.random() * untried.length)];
      newState.triedDirs.push(dir);
      newState.currentDir = dir;
      newState.lastHit = newState.firstHit;

      const r = newState.firstHit[0] + dir[0];
      const c = newState.firstHit[1] + dir[1];

      if (isValidTarget(r, c)) {
        return { move: [r, c], newState };
      } else {
        return getNextCPUMove(newState, previousShots, gridSize);
      }
    } else {
      newState.mode = 'random';
      newState.firstHit = null;
      newState.lastHit = null;
      newState.currentDir = null;
      newState.triedDirs = [];
    }
  }

  let r = 0;
  let c = 0;
  let attempts = 0;
  do {
    r = Math.floor(Math.random() * gridSize);
    c = Math.floor(Math.random() * gridSize);
    attempts++;
  } while (previousShots.has(coordToString(r, c)) && attempts < 1000);

  if (attempts >= 1000) {
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!previousShots.has(coordToString(i, j))) {
          return { move: [i, j], newState };
        }
      }
    }
  }

  return { move: [r, c], newState };
};

export const processCPUHitResult = (
  state: CPUState,
  move: Coord,
  isHit: boolean,
  isSunk: boolean
): CPUState => {
  if (isSunk) {
    return { mode: 'random', firstHit: null, lastHit: null, currentDir: null, triedDirs: [] };
  }

  if (isHit) {
    if (state.mode === 'random') {
      return { mode: 'hunt', firstHit: move, lastHit: move, currentDir: null, triedDirs: [] };
    } else if (state.mode === 'hunt') {
      return { ...state, lastHit: move };
    }
  } else {
    if (state.mode === 'hunt') {
      return { ...state, lastHit: state.firstHit, currentDir: null };
    }
  }

  return state;
};
