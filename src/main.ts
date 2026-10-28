import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';
import { EditorSession } from './application/EditorSession.js';
import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { Repl } from './cli/Repl.js';

const session = new EditorSession(new FileDocumentStore());
await new Repl(new CommandDispatcher(session)).run();
