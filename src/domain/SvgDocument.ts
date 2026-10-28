import { Shape } from './Shape.js';
import { Group } from './Group.js';

export class SvgDocument {
  private root = new Group('__canvas__');
  private widthValue: number;
  private heightValue: number;
  constructor(width = 800, height = 600) {
    this.widthValue = Shape.number(width, true);
    this.heightValue = Shape.number(height, true);
  }
  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }
  get children(): readonly Shape[] { return this.root.children; }
  resize(width: number, height: number): void {
    const w = Shape.number(width, true), h = Shape.number(height, true);
    this.widthValue = w; this.heightValue = h;
  }
  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (node: Shape): void => { result.push(node); node.children.forEach(visit); };
    this.children.forEach(visit);
    return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(node => node.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  has(id: string): boolean { return this.all().some(node => node.id === id); }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    if (!this.has(id)) throw new Error(`no such container: ${id}`);
    const node = this.find(id);
    if (!(node instanceof Group)) throw new Error(`not a container: ${id}`);
    return node;
  }
  parent(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(node => node.children.includes(shape));
    if (!(parent instanceof Group)) throw new Error(`no parent: ${shape.id}`);
    return parent;
  }
  parentLabel(shape: Shape): string {
    const parent = this.parent(shape);
    return parent === this.root ? 'svg' : `g#${parent.id}`;
  }
  add(shape: Shape, parentId?: string): void {
    const ids = new Set(this.all().map(node => node.id));
    const validate = (node: Shape): void => {
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id); node.children.forEach(validate);
    };
    validate(shape);
    this.container(parentId).insert(shape);
  }
  delete(id: string): void { const shape = this.find(id); this.parent(shape).remove(shape); }
  group(id: string, ids: readonly string[]): void {
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
    if (!ids.length || new Set(ids).size !== ids.length) throw new Error('group requires distinct shapes');
    const selected = ids.map(item => this.find(item));
    for (const shape of selected) {
      let ancestor = this.parent(shape);
      while (ancestor !== this.root) {
        if (selected.includes(ancestor)) throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
        ancestor = this.parent(ancestor);
      }
    }
    // Lowest common ancestor owns the new group; selection order follows document preorder.
    let owner = this.parent(selected[0]);
    const contains = (parent: Shape, node: Shape): boolean => parent.children.some(child => child === node || contains(child, node));
    while (!selected.every(node => contains(owner, node))) owner = this.parent(owner);
    const order = this.all().filter(node => selected.includes(node));
    const index = owner.children.findIndex(child => selected.includes(child) || selected.some(node => contains(child, node)));
    const group = new Group(id);
    for (const node of order) { this.parent(node).remove(node); group.insert(node); }
    owner.insert(group, index);
  }
  ungroup(id: string): void {
    const group = this.container(id), parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(group);
    group.children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
  }
  addTo(groupId: string, id: string): void {
    const group = this.container(groupId), shape = this.find(id);
    let ancestor: Group = group;
    while (ancestor !== this.root) {
      if (ancestor === shape) throw new Error(`cannot move a container into its own descendant: ${id}`);
      ancestor = this.parent(ancestor);
    }
    this.parent(shape).remove(shape); group.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id), parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape, front ? parent.children.length : 0);
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height); copy.root = this.root.clone(); return copy;
  }
}
