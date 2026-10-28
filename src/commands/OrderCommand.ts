import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class OrderCommand extends EditCommand {
  constructor(private readonly id: string, private readonly front: boolean) { super(); }
  get description(): string { return `${this.id} reordered`; }
  protected apply(document: SvgDocument): void { document.reorder(this.id, this.front); }
}
