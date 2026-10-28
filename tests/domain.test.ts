import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { Group } from '../src/domain/Group.js';
import { Rect } from '../src/domain/Rect.js';
import { TextShape } from '../src/domain/TextShape.js';

test('nested composites move and scale positions and sizes, clone independently', () => {
  const doc = new SvgDocument();
  doc.add(new Group('scene')); doc.add(new Group('node'), 'scene');
  doc.add(new Rect('r', 10, 20, 30, 40), 'node'); doc.add(new TextShape('t', 12, 25, '中文 文本'), 'node');
  const before = doc.clone();
  doc.find('scene').move(5, -10); doc.find('scene').scale(2);
  assert.deepEqual(doc.find('r').geometry(), {x:'30', y:'20', width:'60', height:'80'});
  assert.deepEqual(doc.find('t').geometry(), {x:'34', y:'30'});
  assert.equal(before.find('r').attributes.x, '10');
});

test('group preserves tree order, ungroup preserves slot, top-level is forbidden', () => {
  const doc = new SvgDocument(); doc.add(new Group('scene'));
  for (const id of ['a','b','c']) doc.add(new Rect(id, 0, 0, 1, 1), 'scene');
  doc.group('pair', ['c', 'a']);
  assert.deepEqual(doc.find('pair').children.map(s => s.id), ['a','c']);
  doc.ungroup('pair');
  assert.deepEqual(doc.find('scene').children.map(s => s.id), ['a','c','b']);
  assert.throws(() => doc.ungroup('scene'), /top-level/);
});

test('id uniqueness, cycle checks, attribute validation and factory boundaries', () => {
  const doc = new SvgDocument(); doc.add(new Group('g')); doc.add(new Group('nested'), 'g');
  assert.throws(() => doc.add(new Group('g')), /already exists/);
  assert.throws(() => doc.group('bad', ['nested','g']), /own descendant/);
  assert.throws(() => doc.addTo('nested','g'), /own descendant/);
  const factory = new ShapeFactory();
  for (const [type, args] of [['rect',['0','0','1','1']], ['circle',['1','2','3']], ['ellipse',['1','2','3','4']], ['line',['1','2','3','4']], ['text',['1','2','hello world']], ['g',[]]] as const) {
    const shape = factory.create(type, type, args);
    assert.equal(shape.tag, type); assert.throws(() => shape.set('id','new'), /unknown attribute/);
    assert.throws(() => shape.scale(0), /positive/);
  }
  assert.throws(() => factory.create('box', 'x', []), /unknown shape type/);
  assert.throws(() => factory.create('rect','x',['0','0','-1','1']), /invalid number/);
});

test('cross-parent grouping uses lowest common ancestor and document order', () => {
  const doc = new SvgDocument();
  doc.add(new Group('left')); doc.add(new Group('right'));
  doc.add(new Rect('a', 0, 0, 1, 1), 'left'); doc.add(new Rect('b', 0, 0, 1, 1), 'right');
  doc.group('both', ['b','a']);
  assert.deepEqual(doc.children.map(s => s.id), ['both','left','right']);
  assert.deepEqual(doc.find('both').children.map(s => s.id), ['a','b']);
});

test('front/back follow SVG painting order and addto appends without changing geometry', () => {
  const doc = new SvgDocument(); doc.add(new Group('g'));
  for (const id of ['a','b','c']) doc.add(new Rect(id, 3, 4, 5, 6));
  doc.reorder('a',true); assert.equal(doc.children.at(-1)?.id, 'a');
  doc.reorder('c',false); assert.equal(doc.children[0].id, 'c');
  doc.addTo('g','c'); doc.addTo('g','a');
  assert.deepEqual(doc.find('g').children.map(s => s.id), ['c','a']);
  assert.deepEqual(doc.find('a').geometry(), {x:'3',y:'4',width:'5',height:'6'});
});
