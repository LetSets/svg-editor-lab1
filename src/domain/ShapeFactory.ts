import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { TextShape } from './TextShape.js';
import { Group } from './Group.js';

export class ShapeFactory {
  // Phase 1 dispatch point: replace with provider registration in the plugin phase.
  private readonly types = new Map<string, { keys: string[]; style?: string; text?: boolean; build: (id: string, values: number[], content: string) => Shape }>([
    ['rect', { keys: ['x', 'y', 'width', 'height'], style: 'fill', build: (id, v) => new Rect(id, v[0], v[1], v[2], v[3]) }],
    ['circle', { keys: ['cx', 'cy', 'r'], style: 'fill', build: (id, v) => new Circle(id, v[0], v[1], v[2]) }],
    ['ellipse', { keys: ['cx', 'cy', 'rx', 'ry'], style: 'fill', build: (id, v) => new Ellipse(id, v[0], v[1], v[2], v[3]) }],
    ['line', { keys: ['x1', 'y1', 'x2', 'y2'], style: 'stroke', build: (id, v) => new Line(id, v[0], v[1], v[2], v[3]) }],
    ['text', { keys: ['x', 'y'], text: true, build: (id, v, text) => new TextShape(id, v[0], v[1], text) }],
    ['g', { keys: [], build: id => new Group(id) }],
  ]);
  private definition(type: string) {
    const definition = this.types.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
  create(type: string, id: string, args: readonly string[]): Shape {
    const definition = this.definition(type);
    const required = definition.keys.length + (definition.text ? 1 : 0);
    if (args.length < required || args.length > required + (definition.style ? 1 : 0)) throw new Error(`invalid parameters for ${type}`);
    const shape = definition.build(id, args.slice(0, definition.keys.length).map(value => Shape.number(value)), definition.text ? args[definition.keys.length] : '');
    if (definition.style && args.length > required) shape.set(definition.style, args[required]);
    return shape;
  }
  fromAttributes(type: string, id: string, attrs: Record<string, string>, text: string): Shape {
    const definition = this.definition(type);
    const values = definition.keys.map(key => Shape.number(attrs[key] ?? '0'));
    const shape = definition.build(id, values, text);
    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'id' && !definition.keys.includes(key)) shape.set(key, value);
    }
    return shape;
  }
}
