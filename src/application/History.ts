import type { Command } from '../commands/Command.js';
import type { SvgDocument } from '../domain/SvgDocument.js';

export class History {
  private past: Command[] = [];
  private future: Command[] = [];
  private blocked = true;
  execute(command: Command, document: SvgDocument): SvgDocument {
    const next = command.execute(document);
    this.past.push(command); this.future = []; this.blocked = false;
    return next;
  }
  boundary(): void { this.past = []; this.future = []; this.blocked = true; }
  undo(): SvgDocument {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(); this.past.pop(); this.future.push(command); return result;
  }
  redo(): SvgDocument {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(); this.future.pop(); this.past.push(command); return result;
  }
}
