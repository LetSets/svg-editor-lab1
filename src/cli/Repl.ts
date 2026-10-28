import { createInterface } from 'node:readline';
import type { CommandDispatcher } from './CommandDispatcher.js';

export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher) {}
  async run(): Promise<void> {
    const interactive = Boolean(process.stdin.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
    process.stdout.write("svg-editor 0.1 — type 'help' for commands\n");
    input.setPrompt('svg> ');
    if (interactive) input.prompt();
    for await (const line of input) {
      const output = await this.dispatcher.handle(line);
      if (output) process.stdout.write(output + '\n');
      if (!interactive && output.startsWith('error:')) process.exitCode = 1;
      if (interactive) input.prompt();
    }
  }
}
