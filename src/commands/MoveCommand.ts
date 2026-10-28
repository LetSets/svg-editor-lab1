import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class MoveCommand extends EditCommand {
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  get description(): string { return `${this.id} moved`; }
  protected apply(document: SvgDocument): void { document.find(this.id).move(this.dx, this.dy); }
}
