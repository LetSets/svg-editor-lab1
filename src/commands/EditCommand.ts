import type { Command } from './Command.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

/** Command + Memento: apply to an isolated copy and publish only after success. */
export abstract class EditCommand implements Command {
  private before?: SvgDocument;
  private after?: SvgDocument;
  abstract readonly description: string;
  protected abstract apply(document: SvgDocument): void;
  execute(document: SvgDocument): SvgDocument {
    const working = document.clone();
    this.apply(working);
    this.before = document.clone(); this.after = working.clone();
    return working;
  }
  undo(): SvgDocument {
    if (!this.before) throw new Error('command has not executed');
    return this.before.clone();
  }
  redo(): SvgDocument {
    if (!this.after) throw new Error('command has not executed');
    return this.after.clone();
  }
}
