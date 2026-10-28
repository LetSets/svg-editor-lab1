import { Shape } from './Shape.js';

export class Group extends Shape {
  readonly tag = 'g';
  private nodes: Shape[] = [];
  override get children(): readonly Shape[] { return [...this.nodes]; }
  geometry(): Record<string, string> { return {}; }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || this.containsIn(shape, this)) throw new Error('cannot move a container into its own descendant');
    this.nodes.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error(`no such shape: ${shape.id}`);
    this.nodes.splice(index, 1);
    return index;
  }
  private containsIn(root: Shape, target: Shape): boolean {
    return root.children.some(child => child === target || this.containsIn(child, target));
  }
  move(dx: number, dy: number): void { for (const child of this.nodes) child.move(dx, dy); }
  scale(factor: number): void { Shape.factor(factor); for (const child of this.nodes) child.scale(factor); }
  clone(): Group {
    const copy = new Group(this.id);
    this.copyStyles(copy);
    for (const child of this.nodes) copy.insert(child.clone());
    return copy;
  }
}
