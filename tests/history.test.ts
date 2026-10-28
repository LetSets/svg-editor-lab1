import { test } from 'node:test';
import assert from 'node:assert/strict';
import { History } from '../src/application/History.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Rect } from '../src/domain/Rect.js';
import { Group } from '../src/domain/Group.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { DeleteCommand } from '../src/commands/DeleteCommand.js';
import { GroupCommand } from '../src/commands/GroupCommand.js';
import { ScaleCommand } from '../src/commands/ScaleCommand.js';

test('command atomicity: overflow late in a group leaves document and history unchanged', () => {
  const history = new History(); let doc = new SvgDocument();
  doc.add(new Group('g')); doc.add(new Rect('a', 1, 1, 2, 2), 'g'); doc.add(new Rect('b', 1e308, 1, 2, 2), 'g');
  doc = history.execute(new MoveCommand('a', 1, 0), doc);
  const state = doc.all().map(s => s.attributes);
  assert.throws(() => history.execute(new ScaleCommand('g', 10), doc), /invalid number/);
  assert.deepEqual(doc.all().map(s => s.attributes), state);
  assert.equal(history.undo().find('a').attributes.x, '1');
});

test('group is one undo unit; delete undo restores parent and exact order', () => {
  const history = new History(); let doc = new SvgDocument();
  for (const id of ['a','b','c']) doc.add(new Rect(id, 0, 0, 1, 1));
  doc = history.execute(new GroupCommand('g', ['b','c']), doc);
  assert.deepEqual(history.undo().children.map(s => s.id), ['a','b','c']);
  doc = history.redo();
  doc = history.execute(new DeleteCommand('b'), doc);
  doc = history.undo();
  assert.deepEqual(doc.find('g').children.map(s => s.id), ['b','c']);
});

test('new edits clear redo; boundaries discard old history; failed edits preserve redo', () => {
  const history = new History(); let doc = new SvgDocument();
  assert.throws(() => history.undo(), /not allowed after io/);
  doc = history.execute(new CreateCommand(new Rect('a', 0, 0, 1, 1)), doc);
  doc = history.execute(new MoveCommand('a', 10, 0), doc);
  doc = history.undo();
  assert.throws(() => history.execute(new DeleteCommand('missing'), doc), /no such shape/);
  doc = history.redo(); assert.equal(doc.find('a').attributes.x, '10');
  doc = history.undo(); doc = history.execute(new MoveCommand('a', 2, 0), doc);
  assert.throws(() => history.redo(), /nothing to redo/);
  history.boundary(); assert.throws(() => history.redo(), /not allowed after io/);
  doc = history.execute(new MoveCommand('a', 3, 0), doc);
  assert.equal(history.undo().find('a').attributes.x, '2');
  assert.throws(() => history.undo(), /nothing to undo/);
});
