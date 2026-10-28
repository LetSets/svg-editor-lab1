import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super(); }
  get description(): string { return `${this.id} ungrouped`; }
  protected apply(document: SvgDocument): void { document.ungroup(this.id); }
}
