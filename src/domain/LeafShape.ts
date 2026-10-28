import { Shape } from './Shape.js';

export abstract class LeafShape extends Shape {
  private readonly values: Record<string, number>;
  protected constructor(id: string, values: Record<string, number>, private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[], private readonly sizes: readonly string[]) {
    super(id);
    this.values = {};
    for (const [key, value] of Object.entries(values)) this.values[key] = Shape.number(value, sizes.includes(key));
  }
  protected value(key: string): number { return this.values[key]; }
  geometry(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.values).map(([key, value]) => [key, String(value)]));
  }
  override set(attribute: string, value: string): void {
    if (Object.hasOwn(this.values, attribute)) this.values[attribute] = Shape.number(value, this.sizes.includes(attribute));
    else super.set(attribute, value);
  }
  move(dx: number, dy: number): void {
    Shape.number(dx); Shape.number(dy);
    const next = { ...this.values };
    for (const key of this.xKeys) next[key] = Shape.number(next[key] + dx);
    for (const key of this.yKeys) next[key] = Shape.number(next[key] + dy);
    Object.assign(this.values, next);
  }
  scale(factor: number): void {
    Shape.factor(factor);
    const next = Object.fromEntries(Object.entries(this.values).map(([key, value]) => [key, Shape.number(value * factor)]));
    Object.assign(this.values, next);
  }
}
