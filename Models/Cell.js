export default class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.flagged = false;
    this.visible = false;
    this.visited = false;
    this.value = 0;
  }
}
