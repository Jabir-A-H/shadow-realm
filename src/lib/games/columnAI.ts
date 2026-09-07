import { Cell, checkLineWin } from './lineWinCheck';

const ROWS = 6;
const WIN_LENGTH = 4;

export function getColumnAIMove(
  board: Cell[][],
  difficulty: 'easy' | 'medium' | 'hard',
  cpuPlayer: Cell
): number {
  const humanPlayer = cpuPlayer === 1 ? 2 : 1;

  const validCols: number[] = [];
  const colOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const c of colOrder) {
    if (board[0][c] === 0) validCols.push(c);
  }
  if (validCols.length === 0) return -1;

  if (difficulty === 'hard') {
    let bestScore = -Infinity;
    let bestMoves: number[] = [];

    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = cpuPlayer;
      const score = minimax(board, 0, false, cpuPlayer, humanPlayer, -Infinity, Infinity, r, c);
      board[r][c] = 0;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [c];
      } else if (score === bestScore) {
        bestMoves.push(c);
      }
    }

    if (bestMoves.length === 1) {
      return bestMoves[0];
    }

    const weights = [1, 2, 3, 4, 3, 2, 1];
    let totalWeight = 0;
    for (const move of bestMoves) {
      totalWeight += weights[move];
    }

    let randomVal = Math.random() * totalWeight;
    for (const move of bestMoves) {
      randomVal -= weights[move];
      if (randomVal <= 0) return move;
    }
    return bestMoves[0];
  }

  // Medium: Win or Block
  if (difficulty === 'medium') {
    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = cpuPlayer;
      if (checkLineWin(board, r, c, WIN_LENGTH).won) {
        board[r][c] = 0;
        return c;
      }
      board[r][c] = 0;
    }

    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = humanPlayer;
      if (checkLineWin(board, r, c, WIN_LENGTH).won) {
        board[r][c] = 0;
        return c;
      }
      board[r][c] = 0;
    }
  }

  // Easy
  if (difficulty === 'easy' && Math.random() < 0.3) {
    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = humanPlayer;
      if (checkLineWin(board, r, c, WIN_LENGTH).won) {
        board[r][c] = 0;
        return c;
      }
      board[r][c] = 0;
    }
  }

  return validCols[Math.floor(Math.random() * validCols.length)];
}

function getDropRow(board: Cell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

function minimax(
  board: Cell[][],
  depth: number,
  isMaximizing: boolean,
  cpuPlayer: Cell,
  humanPlayer: Cell,
  alpha: number,
  beta: number,
  lastR: number,
  lastC: number
): number {
  if (lastR !== -1) {
    if (checkLineWin(board, lastR, lastC, WIN_LENGTH).won) {
      return isMaximizing ? -1000 + depth : 1000 - depth;
    }
  }

  if (depth >= 7) {
    return scorePosition(board, cpuPlayer);
  }

  const validCols: number[] = [];
  const colOrder = [3, 2, 4, 1, 5, 0, 6];
  for (const c of colOrder) {
    if (board[0][c] === 0) validCols.push(c);
  }

  if (validCols.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = cpuPlayer;
      const ev = minimax(board, depth + 1, false, cpuPlayer, humanPlayer, alpha, beta, r, c);
      board[r][c] = 0;
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const c of validCols) {
      const r = getDropRow(board, c);
      board[r][c] = humanPlayer;
      const ev = minimax(board, depth + 1, true, cpuPlayer, humanPlayer, alpha, beta, r, c);
      board[r][c] = 0;
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function scorePosition(board: Cell[][], player: Cell): number {
  let score = 0;
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][3] === player) centerCount++;
  }
  score += centerCount * 3;
  return score;
}
