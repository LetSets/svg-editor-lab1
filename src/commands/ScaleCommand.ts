import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class ScaleCommand extends EditCommand {
  constructor(private readonly id: string, private readonly factor: number) { super(); }
  get description(): string { return `${this.id} scaled`; }
  protected apply(document: SvgDocument): void { document.find(this.id).scale(this.factor); }
}
