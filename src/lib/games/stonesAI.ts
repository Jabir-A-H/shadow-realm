import { Cell, checkLineWin } from './lineWinCheck';

export function getStonesAIMove(
  board: Cell[][],
  difficulty: 'easy' | 'medium' | 'hard',
  cpuPlayer: Cell,
  winLength: number
): [number, number] {
  const humanPlayer = cpuPlayer === 1 ? 2 : 1;
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === 0) emptyCells.push([r, c]);
    }
  }

  if (emptyCells.length === 0) return [-1, -1];

  // Hard 3x3 (minimax)
  if (difficulty === 'hard' && board.length === 3) {
    let bestScore = -Infinity;
    let bestMove = emptyCells[0];
    for (const [r, c] of emptyCells) {
      board[r][c] = cpuPlayer;
      const score = minimax(board, false, cpuPlayer, humanPlayer, winLength, 0, r, c);
      board[r][c] = 0;
      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }
    return bestMove;
  }

  // 1. Can CPU win right now?
  if (difficulty === 'medium' || difficulty === 'hard') {
    for (const [r, c] of emptyCells) {
      board[r][c] = cpuPlayer;
      const win = checkLineWin(board, r, c, winLength);
      board[r][c] = 0;
      if (win.won) return [r, c];
    }
  }

  // 2. Can Human win right now? Block it.
  for (const [r, c] of emptyCells) {
    board[r][c] = humanPlayer;
    const win = checkLineWin(board, r, c, winLength);
    board[r][c] = 0;
    if (win.won) return [r, c];
  }

  // 3. Medium
  if (difficulty === 'medium') {
    return getHeuristicMove(board, emptyCells);
  }

  // 4. Hard 9x9 / 15x15
  if (difficulty === 'hard' && board.length > 3) {
    for (const [r, c] of emptyCells) {
      board[r][c] = cpuPlayer;
      let createdThreats = 0;
      const subEmpty = emptyCells.filter(([er, ec]) => er !== r || ec !== c);
      for (const [hr, hc] of subEmpty) {
        board[hr][hc] = cpuPlayer;
        if (checkLineWin(board, hr, hc, winLength).won) createdThreats++;
        board[hr][hc] = 0;
      }
      board[r][c] = 0;
      if (createdThreats >= 2) return [r, c];
    }

    for (const [r, c] of emptyCells) {
      board[r][c] = humanPlayer;
      let humanThreats = 0;
      const subEmpty = emptyCells.filter(([er, ec]) => er !== r || ec !== c);
      for (const [hr, hc] of subEmpty) {
        board[hr][hc] = humanPlayer;
        if (checkLineWin(board, hr, hc, winLength).won) humanThreats++;
        board[hr][hc] = 0;
      }
      board[r][c] = 0;
      if (humanThreats >= 2) return [r, c];
    }

    return getHeuristicMove(board, emptyCells);
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getHeuristicMove(board: Cell[][], emptyCells: [number, number][]): [number, number] {
  const center = Math.floor(board.length / 2);
  if (board[center][center] === 0) return [center, center];

  const adjacents = emptyCells.filter(([r, c]) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board.length) {
          if (board[nr][nc] !== 0) return true;
        }
      }
    }
    return false;
  });

  if (adjacents.length > 0) {
    return adjacents[Math.floor(Math.random() * adjacents.length)];
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function minimax(
  board: Cell[][],
  isMaximizing: boolean,
  cpuPlayer: Cell,
  humanPlayer: Cell,
  winLength: number,
  depth: number,
  lastR: number,
  lastC: number
): number {
  if (lastR !== -1) {
    const win = checkLineWin(board, lastR, lastC, winLength);
    if (win.won) {
      return isMaximizing ? -10 + depth : 10 - depth;
    }
  }

  const emptyCells: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === 0) emptyCells.push([r, c]);
    }
  }

  if (emptyCells.length === 0) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const [r, c] of emptyCells) {
      board[r][c] = cpuPlayer;
      const score = minimax(board, false, cpuPlayer, humanPlayer, winLength, depth + 1, r, c);
      board[r][c] = 0;
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const [r, c] of emptyCells) {
      board[r][c] = humanPlayer;
      const score = minimax(board, true, cpuPlayer, humanPlayer, winLength, depth + 1, r, c);
      board[r][c] = 0;
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}
