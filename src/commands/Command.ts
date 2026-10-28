import type { SvgDocument } from '../domain/SvgDocument.js';

export interface Command {
  readonly description: string;
  execute(document: SvgDocument): SvgDocument;
  undo(): SvgDocument;
  redo(): SvgDocument;
}
