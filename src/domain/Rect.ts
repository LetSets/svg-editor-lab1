import { LeafShape } from './LeafShape.js';

export class Rect extends LeafShape {
  readonly tag = 'rect';
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ["x"], ["y"], ["width", "height"]);
  }
  clone(): Rect {
    const copy = new Rect(this.id, this.value('x'), this.value('y'), this.value('width'), this.value('height')); this.copyStyles(copy); return copy;
  }
}
