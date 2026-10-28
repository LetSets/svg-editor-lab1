import { EditorSession } from '../application/EditorSession.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { OrderCommand } from '../commands/OrderCommand.js';
import { Tokenizer } from './Tokenizer.js';
import { Arguments } from './Arguments.js';
import { TreeFormatter } from './TreeFormatter.js';

export class CommandDispatcher {
  private readonly tokenizer = new Tokenizer();
  private readonly formatter = new TreeFormatter();
  // Phase 1 dispatch point: future command providers can replace this fixed registry.
  private readonly commands: Map<string, { usage: string; run: (args: Arguments) => string | Promise<string> }>;
  constructor(private readonly session: EditorSession, private readonly factory = new ShapeFactory()) {
    this.commands = new Map([
      ['init', { usage: 'init [w] [h]', run: a => { a.count(0, 2); return session.init(a.length ? a.number(0) : 800, a.length > 1 ? a.number(1) : 600); } }],
      ['read', { usage: 'read <file.svg>', run: a => { a.count(1); return session.read(a.text(0)); } }],
      ['save', { usage: 'save [file.svg]', run: a => { a.count(0, 1); return session.save(a.text(0)); } }],
      ['canvas', { usage: 'canvas [w h]', run: a => {
        if (a.length === 0) return session.canvas(); a.count(2); return session.canvas(a.number(0), a.number(1));
      } }],
      ['create', { usage: 'create <type> <id> [params...] [in <containerId>]', run: a => this.create(a) }],
      ['delete', { usage: 'delete <id>', run: a => { a.count(1); return session.execute(new DeleteCommand(a.text(0))); } }],
      ['move', { usage: 'move <id> <dx> <dy>', run: a => { a.count(3); return session.execute(new MoveCommand(a.text(0), a.number(1), a.number(2))); } }],
      ['scale', { usage: 'scale <id> <factor>', run: a => { a.count(2); return session.execute(new ScaleCommand(a.text(0), a.number(1))); } }],
      ['set', { usage: 'set <id> <attr> <value>', run: a => { a.count(3); return session.execute(new SetCommand(a.text(0), a.text(1), a.text(2))); } }],
      ['group', { usage: 'group <newGid> <id1> <id2>...', run: a => { a.count(2, Infinity); return session.execute(new GroupCommand(a.text(0), a.rest(1))); } }],
      ['ungroup', { usage: 'ungroup <gid>', run: a => { a.count(1); return session.execute(new UngroupCommand(a.text(0))); } }],
      ['addto', { usage: 'addto <gid> <id>', run: a => { a.count(2); return session.execute(new AddToCommand(a.text(0), a.text(1))); } }],
      ['front', { usage: 'front <id>', run: a => { a.count(1); return session.execute(new OrderCommand(a.text(0), true)); } }],
      ['back', { usage: 'back <id>', run: a => { a.count(1); return session.execute(new OrderCommand(a.text(0), false)); } }],
      ['tree', { usage: 'tree [id]', run: a => { a.count(0, 1); return this.formatter.tree(session.document, a.text(0)); } }],
      ['show', { usage: 'show <id>', run: a => { a.count(1); return this.formatter.show(session.document, a.text(0)); } }],
      ['help', { usage: 'help', run: a => { a.count(0); return this.help(); } }],
      ['undo', { usage: 'undo', run: a => { a.count(0); return session.undo(); } }],
      ['redo', { usage: 'redo', run: a => { a.count(0); return session.redo(); } }],
    ]);
  }
  async handle(line: string): Promise<string> {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (!tokens.length) return '';
      const entry = this.commands.get(tokens[0]);
      if (!entry) throw new Error(`unknown command: ${tokens[0]}`);
      // help works before init; all other document-dependent commands require a document.
      if (!['init', 'read', 'help'].includes(tokens[0])) this.session.document;
      return await entry.run(new Arguments(tokens.slice(1)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `error: ${message.replace(/[\r\n]+/g, ' ')}`;
    }
  }
  private create(args: Arguments): string {
    args.count(2, Infinity);
    const parameters = args.rest(2);
    let parentId: string | undefined;
    if (parameters.length >= 2 && parameters.at(-2) === 'in') { parentId = parameters.pop(); parameters.pop(); }
    const shape = this.factory.create(args.text(0), args.text(1), parameters);
    return this.session.execute(new CreateCommand(shape, parentId));
  }
  private help(): string {
    return [...this.commands.values()].map(entry => entry.usage).join('\n') + '\n\n' + [
      'create rect <id> <x> <y> <w> <h> [fill]',
      'create circle <id> <cx> <cy> <r> [fill]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke]',
      'create text <id> <x> <y> "content"',
      'create g <id>',
      'All create forms accept [in <containerId>]. Exit with Ctrl-D (EOF).',
    ].join('\n');
  }
}
