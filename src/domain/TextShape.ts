import { LeafShape } from './LeafShape.js';

export class TextShape extends LeafShape {
  readonly tag = 'text';
  constructor(id: string, x: number, y: number, private content: string) {
    super(id, { x, y }, ["x"], ["y"], []);
  }
  override get textContent(): string { return this.content; }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = value; else super.set(attribute, value);
  }
  clone(): TextShape {
    const copy = new TextShape(this.id, this.value('x'), this.value('y'), this.content); this.copyStyles(copy); return copy;
  }
}
