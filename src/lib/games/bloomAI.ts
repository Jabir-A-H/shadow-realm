export type Player = 1 | 2;

export interface BloomCell {
  owner: Player | null;
  orbs: number;
}

export type BloomBoard = BloomCell[][];

export function getCapacity(r: number, c: number, rows: number, cols: number): number {
  let count = 0;
  if (r > 0) count++;
  if (r < rows - 1) count++;
  if (c > 0) count++;
  if (c < cols - 1) count++;
  return count;
}

export function getNeighbors(r: number, c: number, rows: number, cols: number): [number, number][] {
  const list: [number, number][] = [];
  if (r > 0) list.push([r - 1, c]);
  if (r < rows - 1) list.push([r + 1, c]);
  if (c > 0) list.push([r, c - 1]);
  if (c < cols - 1) list.push([r, c + 1]);
  return list;
}

export function cloneBoard(board: BloomBoard): BloomBoard {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Pure non-animated simulation of a cascade.
 * Returns the final board state and total converted orbs.
 */
export function simulateCascade(
  initialBoard: BloomBoard,
  startR: number,
  startC: number,
  player: Player,
  rows: number,
  cols: number
): { finalBoard: BloomBoard; opponentEliminated: boolean; totalPlayerOrbs: number } {
  const b = cloneBoard(initialBoard);
  const opponent: Player = player === 1 ? 2 : 1;

  b[startR][startC].orbs++;
  b[startR][startC].owner = player;

  const queue: [number, number][] = [];
  if (b[startR][startC].orbs >= getCapacity(startR, startC, rows, cols)) {
    queue.push([startR, startC]);
  }

  let iterations = 0;
  const maxIterations = 500; // safety ceiling for extreme chains

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const [r, c] = queue.shift()!;
    const cap = getCapacity(r, c, rows, cols);

    if (b[r][c].orbs < cap) continue;

    b[r][c].orbs -= cap;
    if (b[r][c].orbs === 0) {
      b[r][c].owner = null;
    }

    const neighbors = getNeighbors(r, c, rows, cols);
    for (const [nr, nc] of neighbors) {
      b[nr][nc].orbs++;
      b[nr][nc].owner = player;

      if (b[nr][nc].orbs >= getCapacity(nr, nc, rows, cols)) {
        queue.push([nr, nc]);
      }
    }
  }

  let totalPlayerOrbs = 0;
  let totalOpponentOrbs = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (b[r][c].owner === player) totalPlayerOrbs += b[r][c].orbs;
      else if (b[r][c].owner === opponent) totalOpponentOrbs += b[r][c].orbs;
    }
  }

  return {
    finalBoard: b,
    opponentEliminated: totalOpponentOrbs === 0,
    totalPlayerOrbs,
  };
}

/**
 * Heuristic AI move selector.
 */
export function getBloomAIMove(
  board: BloomBoard,
  difficulty: 'easy' | 'medium' | 'hard',
  cpuPlayer: Player,
  rows: number,
  cols: number
): [number, number] {
  const opponent: Player = cpuPlayer === 1 ? 2 : 1;
  const validMoves: [number, number][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].owner === null || board[r][c].owner === cpuPlayer) {
        validMoves.push([r, c]);
      }
    }
  }

  if (validMoves.length === 0) return [-1, -1];

  // EASY TIER: Positional scoring + 15% intentional random moves
  if (difficulty === 'easy') {
    if (Math.random() < 0.15) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const [r, c] of validMoves) {
      const score = scorePositional(board, r, c, cpuPlayer, rows, cols);
      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }

    return bestMove;
  }

  // MEDIUM TIER: Immediate Elimination check + Trap Avoidance + Positional
  if (difficulty === 'medium') {
    // 1. Check for immediate win (eliminate opponent)
    for (const [r, c] of validMoves) {
      const sim = simulateCascade(board, r, c, cpuPlayer, rows, cols);
      if (sim.opponentEliminated) {
        return [r, c];
      }
    }

    // 2. Score with trap avoidance
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const [r, c] of validMoves) {
      let score = scorePositional(board, r, c, cpuPlayer, rows, cols);

      // Penalize moves that leave cell at capacity - 1 adjacent to opponent
      const cap = getCapacity(r, c, rows, cols);
      const resultingOrbs = board[r][c].orbs + 1;

      if (resultingOrbs === cap - 1) {
        const neighbors = getNeighbors(r, c, rows, cols);
        for (const [nr, nc] of neighbors) {
          const n = board[nr][nc];
          if (n.owner === opponent) {
            const nCap = getCapacity(nr, nc, rows, cols);
            if (n.orbs >= nCap - 1) {
              score -= 15; // Danger! Enemy can trigger into this cell immediately
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }

    return bestMove;
  }

  // HARD TIER: Medium checks + Bounded 1-ply lookahead on top 5 candidates
  if (difficulty === 'hard') {
    // 1. Immediate win
    for (const [r, c] of validMoves) {
      const sim = simulateCascade(board, r, c, cpuPlayer, rows, cols);
      if (sim.opponentEliminated) {
        return [r, c];
      }
    }

    // 2. Rank candidates by heuristic score
    const scoredCandidates = validMoves
      .map(([r, c]) => {
        let score = scorePositional(board, r, c, cpuPlayer, rows, cols);
        const cap = getCapacity(r, c, rows, cols);
        const resultingOrbs = board[r][c].orbs + 1;

        if (resultingOrbs === cap - 1) {
          const neighbors = getNeighbors(r, c, rows, cols);
          for (const [nr, nc] of neighbors) {
            const n = board[nr][nc];
            if (n.owner === opponent && n.orbs >= getCapacity(nr, nc, rows, cols) - 1) {
              score -= 15;
            }
          }
        }

        return { move: [r, c] as [number, number], score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Bound to top 5 candidates

    // 3. Evaluate opponent's best response for each candidate
    let bestNetScore = -Infinity;
    let bestMove = scoredCandidates[0].move;

    for (const { move } of scoredCandidates) {
      const [r, c] = move;
      const sim = simulateCascade(board, r, c, cpuPlayer, rows, cols);

      // Find opponent's strongest reply
      const oppMoves: [number, number][] = [];
      for (let or = 0; or < rows; or++) {
        for (let oc = 0; oc < cols; oc++) {
          if (sim.finalBoard[or][oc].owner === null || sim.finalBoard[or][oc].owner === opponent) {
            oppMoves.push([or, oc]);
          }
        }
      }

      let maxOpponentGain = 0;
      for (const [or, oc] of oppMoves.slice(0, 8)) {
        const oppSim = simulateCascade(sim.finalBoard, or, oc, opponent, rows, cols);
        if (oppSim.opponentEliminated) {
          maxOpponentGain = 1000; // Fatal!
          break;
        }
        maxOpponentGain = Math.max(maxOpponentGain, oppSim.totalPlayerOrbs);
      }

      const netScore = sim.totalPlayerOrbs - maxOpponentGain;
      if (netScore > bestNetScore) {
        bestNetScore = netScore;
        bestMove = move;
      }
    }

    return bestMove;
  }

  return validMoves[0];
}

function scorePositional(
  board: BloomBoard,
  r: number,
  c: number,
  player: Player,
  rows: number,
  cols: number
): number {
  const cap = getCapacity(r, c, rows, cols);
  const cell = board[r][c];
  let score = 0;

  // 1. Prefer corners (cap 2) and edges (cap 3)
  if (cap === 2) score += 6;
  else if (cap === 3) score += 3;

  // 2. Closer to blooming is better
  score += (cell.orbs + 1) * 3;

  // 3. Bonus if neighboring enemy cells
  const neighbors = getNeighbors(r, c, rows, cols);
  for (const [nr, nc] of neighbors) {
    const n = board[nr][nc];
    if (n.owner !== null && n.owner !== player) {
      score += 4;
    }
  }

  return score;
}
