export type Cell = 0 | 1 | 2; // 0 = empty, 1 = player one, 2 = player two

export function checkLineWin(
  board: Cell[][],
  lastRow: number,
  lastCol: number,
  winLength: number
): { won: boolean; player: Cell; line: [number, number][] } {
  const player = board[lastRow][lastCol];
  if (player === 0) return { won: false, player: 0, line: [] };

  const directions: [number, number][] = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    const line: [number, number][] = [[lastRow, lastCol]];
    for (const sign of [1, -1]) {
      let r = lastRow + dr * sign;
      let c = lastCol + dc * sign;
      while (
        r >= 0 && r < board.length &&
        c >= 0 && c < board[0].length &&
        board[r][c] === player
      ) {
        if (sign === 1) line.push([r, c]);
        else line.unshift([r, c]);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= winLength) {
      return { won: true, player, line: line.slice(0, winLength) };
    }
  }
  return { won: false, player: 0, line: [] };
}
