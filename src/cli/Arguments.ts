import { Shape } from '../domain/Shape.js';

export class Arguments {
  constructor(private readonly values: readonly string[]) {}
  count(min: number, max = min): this {
    if (this.values.length < min || this.values.length > max) throw new Error('invalid arguments. use help for syntax');
    return this;
  }
  get length(): number { return this.values.length; }
  text(index: number): string { return this.values[index]; }
  number(index: number): number { return Shape.number(this.text(index)); }
  rest(index: number): string[] { return this.values.slice(index); }
}
