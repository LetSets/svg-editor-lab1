import { SvgDocument } from '../domain/SvgDocument.js';
import type { Command } from '../commands/Command.js';
import type { DocumentStore } from '../ports/DocumentStore.js';
import { History } from './History.js';

export class EditorSession {
  private current?: SvgDocument;
  private path?: string;
  private readonly history = new History();
  constructor(private readonly store: DocumentStore) {}
  get document(): SvgDocument { return this.requireDocument().clone(); }
  private requireDocument(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(width = 800, height = 600): string {
    this.current = new SvgDocument(width, height); this.path = undefined; this.history.boundary();
    return `canvas ${width}x${height} created`;
  }
  async read(path: string): Promise<string> {
    const result = await this.store.read(path);
    this.current = result.document; this.path = path; this.history.boundary();
    return [...result.warnings, `read ${path} (${this.current.all().length} elements)`].join('\n');
  }
  async save(path?: string): Promise<string> {
    const document = this.requireDocument(), target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    await this.store.write(target, document);
    this.path = target; this.history.boundary();
    return `saved to ${target} (${document.all().length} elements)`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.requireDocument();
    if (width !== undefined && height !== undefined) { document.resize(width, height); this.history.boundary(); }
    return `canvas ${document.width}x${document.height}`;
  }
  execute(command: Command): string {
    this.current = this.history.execute(command, this.requireDocument());
    return command.description;
  }
  undo(): string { this.requireDocument(); this.current = this.history.undo(); return 'edit undone'; }
  redo(): string { this.requireDocument(); this.current = this.history.redo(); return 'edit redone'; }
}
