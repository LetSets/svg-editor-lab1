import { LeafShape } from './LeafShape.js';

export class Circle extends LeafShape {
  readonly tag = 'circle';
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ["cx"], ["cy"], ["r"]);
  }
  clone(): Circle {
    const copy = new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r')); this.copyStyles(copy); return copy;
  }
}
