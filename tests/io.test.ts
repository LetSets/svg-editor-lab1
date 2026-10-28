import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { Rect } from '../src/domain/Rect.js';

const codec = new SvgCodec();
test('SVG round trip preserves nesting, text escaping, styles and default omissions', () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><g id="g" fill="blue"><rect id="r" x="2" y="3" width="4" height="5"/><text id="t" x="1" y="2"> A &amp; B &lt;中文&gt; </text><line id="l" x1="0" y1="0" x2="10" y2="20" stroke="red"/></g></svg>';
  const first = codec.decode(source).document;
  const second = codec.decode(codec.encode(first)).document;
  assert.deepEqual(second.all().map(s => s.attributes), first.all().map(s => s.attributes));
  assert.equal(second.find('t').textContent, ' A & B <中文> ');
  assert.equal(second.find('r').attributes.fill, undefined);
  assert.equal(second.parentLabel(second.find('r')), 'g#g');
});

test('auto ids avoid explicit ids later in file; duplicates and unsupported XML fail', () => {
  const result = codec.decode('<svg><rect/><rect id="rect1"/><g><circle/></g></svg>');
  assert.deepEqual(result.document.all().map(s => s.id), ['rect2','rect1','g1','circle1']);
  assert.equal(result.warnings[0], 'warning: assigned id rect2 to unnamed <rect>');
  for (const source of [
    '<svg><rect id="a"/><g id="a"/></svg>', '<svg><rect></svg>', '<html/>',
    '<svg><g transform="translate(1,2)"/></svg>', '<svg><path/></svg>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>',
    '<svg width="100" height="100" viewBox="0 0 50 50"/>',
    '<svg><text id="t"><tspan>nested</tspan></text></svg>',
  ]) assert.throws(() => codec.decode(source), undefined, source);
});

test('file IO and session boundaries commit only on success', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'svg-lab-'));
  try {
    const path = join(dir, 'demo.svg');
    const session = new EditorSession(new FileDocumentStore());
    assert.throws(() => session.canvas(), /no document/);
    session.init(); session.execute(new CreateCommand(new Rect('r', 1, 2, 3, 4)));
    await assert.rejects(session.save(), /no file path/);
    session.undo(); session.redo();
    await session.save(path);
    assert.throws(() => session.undo(), /not allowed after io/);
    session.execute(new MoveCommand('r', 2, 0));
    await assert.rejects(session.save(join(dir, 'missing', 'bad.svg')), /cannot write file/);
    session.undo(); assert.equal(session.document.find('r').attributes.x, '1');
    session.redo();
    const invalid = join(dir, 'bad.svg'); await writeFile(invalid, '<svg><rect id="r"/><rect id="r"/></svg>');
    await assert.rejects(session.read(invalid), /already exists/);
    assert.equal(session.document.find('r').attributes.x, '3');
    session.undo();
    await session.read(path); assert.equal(session.document.find('r').attributes.x, '1');
    session.execute(new MoveCommand('r', 4, 0)); await session.save();
    assert.match(await readFile(path, 'utf8'), /x="5"/);
    assert.deepEqual((await readdir(dir)).sort(), ['bad.svg','demo.svg']);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
