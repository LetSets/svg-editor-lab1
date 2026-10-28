import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';

export class TreeFormatter {
  tree(document: SvgDocument, id?: string): string {
    const root = id === undefined ? undefined : document.find(id);
    const lines = [root ? root.describe() : `svg (${document.width}x${document.height})`];
    const append = (children: readonly Shape[], prefix: string): void => {
      children.forEach((child, index) => {
        const last = index === children.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + child.describe());
        append(child.children, prefix + (last ? '    ' : '│   '));
      });
    };
    append(root ? root.children : document.children, '');
    return lines.join('\n');
  }
  show(document: SvgDocument, id: string): string {
    const shape = document.find(id);
    const attributes = Object.entries(shape.attributes).filter(([key]) => key !== 'id').map(([key, value]) => `  ${key}=${value}`);
    if (shape.textContent !== undefined) attributes.push(`  text=${JSON.stringify(shape.textContent)}`);
    return [`${shape.tag}#${shape.id}  parent=${document.parentLabel(shape)}`, ...attributes].join('\n');
  }
}
