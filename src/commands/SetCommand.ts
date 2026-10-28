import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class SetCommand extends EditCommand {
  constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) { super(); }
  get description(): string { return `${this.id} updated: ${this.attribute}=${JSON.stringify(this.value)}`; }
  protected apply(document: SvgDocument): void { document.find(this.id).set(this.attribute, this.value); }
}
