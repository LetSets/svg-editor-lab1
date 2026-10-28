import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';
export class CreateCommand extends EditCommand {
  constructor(private readonly shape: Shape, private readonly parentId?: string) { super(); }
  get description(): string { return `${this.shape.tag}#${this.shape.id} created${this.parentId === undefined ? "" : ` in g#${this.parentId}`}`; }
  protected apply(document: SvgDocument): void { document.add(this.shape.clone(), this.parentId); }
}
