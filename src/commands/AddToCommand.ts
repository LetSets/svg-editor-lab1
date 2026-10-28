import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class AddToCommand extends EditCommand {
  constructor(private readonly groupId: string, private readonly id: string) { super(); }
  get description(): string { return `${this.id} moved into g#${this.groupId}`; }
  protected apply(document: SvgDocument): void { document.addTo(this.groupId, this.id); }
}
