export type TileType = 'slick' | 'wall' | 'dry' | 'goal' | 'hazard';
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideStep {
  from: [number, number];
  to: [number, number];
  direction: SlideDirection;
  outcome: 'normal' | 'won' | 'failed';
}

export const SLIDE_DIRS: Record<SlideDirection, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

export function resolveSlide(
  grid: TileType[][],
  from: [number, number],
  dir: SlideDirection
): { dest: [number, number]; outcome: 'normal' | 'won' | 'failed' } {
  const [dr, dc] = SLIDE_DIRS[dir];
  let [r, c] = from;
  const rows = grid.length;
  const cols = grid[0].length;

  while (true) {
    const nr = r + dr;
    const nc = c + dc;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
      break;
    }

    const tile = grid[nr][nc];

    if (tile === 'wall') {
      break;
    }

    if (tile === 'hazard') {
      return { dest: [nr, nc], outcome: 'failed' };
    }

    if (tile === 'goal') {
      return { dest: [nr, nc], outcome: 'won' };
    }

    r = nr;
    c = nc;
    if (tile === 'dry') {
      break;
    }
  }

  return { dest: [r, c], outcome: 'normal' };
}

/**
 * BFS Solver to calculate the shortest path (minimum moves) from start to goal.
 * Returns the sequence of directions and minimum move count, or null if unsolvable.
 */
export function solveSlideLevel(
  grid: TileType[][],
  start: [number, number],
  maxDepth = 25
): { moves: SlideDirection[]; par: number } | null {
  const queue: { pos: [number, number]; path: SlideDirection[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start[0]},${start[1]}`);

  const directions: SlideDirection[] = ['up', 'down', 'left', 'right'];

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    if (path.length >= maxDepth) continue;

    for (const dir of directions) {
      const { dest, outcome } = resolveSlide(grid, pos, dir);

      if (outcome === 'failed') continue;

      if (outcome === 'won') {
        const fullPath = [...path, dir];
        return { moves: fullPath, par: fullPath.length };
      }

      // If didn't move at all, useless move
      if (dest[0] === pos[0] && dest[1] === pos[1]) continue;

      const key = `${dest[0]},${dest[1]}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: dest, path: [...path, dir] });
      }
    }
  }

  return null;
}
