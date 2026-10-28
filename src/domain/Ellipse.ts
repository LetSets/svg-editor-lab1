import { LeafShape } from './LeafShape.js';

export class Ellipse extends LeafShape {
  readonly tag = 'ellipse';
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, { cx, cy, rx, ry }, ["cx"], ["cy"], ["rx", "ry"]);
  }
  clone(): Ellipse {
    const copy = new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry')); this.copyStyles(copy); return copy;
  }
}
