import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';

test('tokenizer handles comments, hex colors, quoted empties and escaped quotes', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # comment'), []);
  assert.deepEqual(tokenizer.tokenize('set r fill #ffee00'), ['set','r','fill','#ffee00']);
  assert.deepEqual(tokenizer.tokenize('create text t 0 0 ""'), ['create','text','t','0','0','']);
  assert.deepEqual(tokenizer.tokenize('set t text "hello \\"world\\""'), ['set','t','text','hello "world"']);
  assert.throws(() => tokenizer.tokenize('set t text "unfinished'), /unterminated/);
});

test('all CLI editing commands and display-only commands obey history rules', async () => {
  const session = new EditorSession(new FileDocumentStore()), cli = new CommandDispatcher(session);
  assert.match(await cli.handle('help'), /create ellipse/);
  assert.equal(await cli.handle('tree'), "error: no document. use 'init' or 'read' first");
  for (const command of [
    'init', 'create g scene', 'create rect r 10 20 30 40 red in scene',
    'create circle c 50 60 5 in scene', 'create ellipse e 1 2 3 4',
    'create line l 0 1 2 3 black', 'create text t 5 6 "hello world"',
    'set r stroke blue', 'set r stroke-width 2', 'set r width 35',
    'set t text "中文 文本"', 'addto scene t', 'front r', 'back r',
    'group pair c t', 'ungroup pair', 'scale scene 2', 'move scene -1 2',
  ]) assert.ok(!(await cli.handle(command)).startsWith('error:'), command);
  assert.equal(session.document.find('r').attributes.x, '19');
  assert.equal(session.document.find('r').attributes.width, '70');
  assert.equal(session.document.find('r').attributes['stroke-width'], '2');
  assert.match(await cli.handle('tree scene'), /rect#r.*x=19/);
  assert.match(await cli.handle('show r'), /parent=g#scene/);
  await cli.handle('canvas'); await cli.handle('help');
  assert.equal(await cli.handle('undo'), 'edit undone');
  assert.equal(session.document.find('r').attributes.x, '20');
  await cli.handle('redo');
  await cli.handle('delete scene'); assert.equal(session.document.has('r'), false);
  await cli.handle('undo'); assert.equal(session.document.has('r'), true);
  await cli.handle('canvas 400 300');
  assert.equal(await cli.handle('undo'), 'error: undo not allowed after io command');
});

test('CLI errors have specified messages and leave document plus redo unchanged', async () => {
  const session = new EditorSession(new FileDocumentStore()), cli = new CommandDispatcher(session);
  await cli.handle('init'); await cli.handle('create g scene'); await cli.handle('create rect r 1 2 3 4 in scene');
  await cli.handle('move r 10 0'); await cli.handle('undo');
  const before = new SvgCodec().encode(session.document);
  const cases = [
    ['create circle r 0 0 1', 'id already exists: r'],
    ['delete missing', 'no such shape: missing'],
    ['create g child in missing', 'no such container: missing'],
    ['create g child in r', 'not a container: r'],
    ['set r radius 1', 'unknown attribute: radius'],
    ['scale r 0', 'scale factor must be positive'],
    ['ungroup scene', 'cannot ungroup top-level container: scene'],
    ['group bad r scene', 'cannot group a container into its own descendant: scene'],
    ['create box n 0 0 1 1 "title"', 'unknown shape type: box (is the plugin loaded?)'],
  ];
  for (const [command, message] of cases) {
    assert.equal(await cli.handle(command), 'error: ' + message);
    assert.equal(new SvgCodec().encode(session.document), before);
  }
  await cli.handle('redo'); assert.equal(session.document.find('r').attributes.x, '11');
});

test('course flowchart script runs through actual CLI and produces readable SVG', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'svg-cli-'));
  try {
    const target = join(dir, 'flowchart.svg');
    const script = (await readFile('examples/flowchart.commands','utf8')).replace('examples/flowchart.svg', target);
    const result = spawnSync(process.execPath, ['--import','tsx','src/main.ts'], {input: script, encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /saved to .*\(8 elements\)/);
    const document = new SvgCodec().decode(await readFile(target,'utf8')).document;
    assert.equal(document.all().length, 8);
    assert.equal(document.find('process').attributes.y, '100');
    assert.equal(document.find('process-label').textContent, '处理数据 v2');
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('course transcript: grouping, move undo redo, delete restoration and imported ids', async () => {
  const session = new EditorSession(new FileDocumentStore()), cli = new CommandDispatcher(session);
  for (const command of ['init 800 600','create rect bg 0 0 800 600 #ffffff','create text title 20 40 "My Diagram"','create circle c1 100 100 20 red','create rect box 200 80 60 60 #3366ff','group markers c1 box','move c1 30 0','undo','redo','set title text "My Diagram v2"','undo','delete box','undo']) {
    assert.ok(!(await cli.handle(command)).startsWith('error:'),command);
  }
  assert.equal(session.document.find('c1').attributes.cx, '130');
  assert.equal(session.document.find('title').textContent, 'My Diagram');
  assert.deepEqual(session.document.find('markers').children.map(s => s.id), ['c1','box']);
  assert.match(await cli.handle('read examples/other.svg'), /warning: assigned id rect1.*\nread .*\(7 elements\)/);
  assert.equal(session.document.width,400);
});
