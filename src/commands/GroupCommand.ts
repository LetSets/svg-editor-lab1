import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class GroupCommand extends EditCommand {
  constructor(private readonly id: string, private readonly ids: readonly string[]) { super(); }
  get description(): string { return `${this.id} grouped`; }
  protected apply(document: SvgDocument): void { document.group(this.id, this.ids); }
}
