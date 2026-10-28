import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class DeleteCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  get description(): string { return `${this.id} deleted`; }
  protected apply(document: SvgDocument): void { document.delete(this.id); }
}
