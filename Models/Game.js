export default class Game {
  constructor(x, y, bombs, board, bombList) {
    this.x = x;
    this.y = y;
    this.bombCount = bombs;
    this.bombList = bombList;
    this.winCondition = x * y - bombs;
    this.visibleCount = 0;
    this.board = board;
    this.gamestate = "pregame";
  }

  revealCell(cell) {
    let updatedCells = [];
    if (cell.value === 9) {
      let bombs = this.revealBombs();
      this.gamestate = "gameover";
      return bombs;
    }
    this.gamestate = "playing";
    if (cell.value > 0) {
      cell.visible = true;
      this.visibleCount += 1;
      if (this.visibleCount === this.winCondition) this.gamestate = "won";
      return [cell];
    }
    let updatedList = [];
    updatedCells = this.revealArea(cell.x, cell.y, updatedList);
    this.visibleCount += updatedCells.length;
    if (this.visibleCount === this.winCondition) this.gamestate = "won";
    return updatedCells;
  }

  revealBombs() {
    let bombs = this.bombList.map((cell) => {
      this.board[cell.y][cell.x].visible = true;
      return this.board[cell.y][cell.x];
    });
    return bombs;
  }

  revealArea = (x, y, updatedList) => {
    let startX = Math.max(0, x - 1);
    let endX = Math.min(this.board[0].length, x + 2);
    let startY = Math.max(0, y - 1);
    let endY = Math.min(this.board.length, y + 2);
    updatedList.push(this.board[y][x]);
    this.board[y][x].visible = true;
    this.board[y][x].visited = true;
    this.board[y][x].flagged = false;
    for (let i = startY; i < endY; i++) {
      for (let j = startX; j < endX; j++) {
        if (
          this.board[i][j].visited === false &&
          this.board[i][j].value === 0
        ) {
          this.revealArea(j, i, updatedList);
        }
        if (this.board[i][j].visited) continue;
        this.board[i][j].visible = true;
        this.board[i][j].visited = true;
        this.board[i][j].flagged = false;
        updatedList.push(this.board[i][j]);
      }
    }

    return updatedList;
  };
}
