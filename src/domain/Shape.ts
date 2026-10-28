export abstract class Shape {
  private readonly styles = new Map<string, string>();
  constructor(public readonly id: string) {
    if (!id || /\s/.test(id)) throw new Error('id must be nonempty and contain no whitespace');
  }
  abstract readonly tag: string;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract geometry(): Record<string, string>;
  get children(): readonly Shape[] { return []; }
  get textContent(): string | undefined { return undefined; }
  get attributes(): Record<string, string> {
    return { id: this.id, ...this.geometry(), ...Object.fromEntries(this.styles) };
  }
  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      throw new Error(`unknown attribute: ${attribute}`);
    }
    if (attribute === 'stroke-width') Shape.number(value, true);
    this.styles.set(attribute, value);
  }
  protected copyStyles(target: Shape): void {
    for (const [key, value] of this.styles) target.set(key, value);
  }
  describe(): string {
    const details = Object.entries(this.attributes).filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key}=${value}`).join(' ');
    return `${this.tag}#${this.id}${details ? '  ' + details : ''}${this.textContent === undefined ? '' : ' ' + JSON.stringify(this.textContent)}`;
  }
  static number(value: string | number, nonnegative = false): number {
    const result = typeof value === 'number' ? value : Number(value);
    if (String(value).trim() === '' || !Number.isFinite(result) || (nonnegative && result < 0)) {
      throw new Error(`invalid number: ${value}`);
    }
    return result;
  }
  static factor(value: number): void {
    if (!Number.isFinite(value) || value <= 0) throw new Error('scale factor must be positive');
  }
}
