import { DOMParser, XMLSerializer, DOMImplementation } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import type { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  constructor(private readonly factory = new ShapeFactory()) {}
  decode(source: string): { document: SvgDocument; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('unsupported SVG: DTD and entities');
    const issues: string[] = [];
    const xml = new DOMParser({ errorHandler: {
      warning: message => issues.push(message), error: message => issues.push(message), fatalError: message => issues.push(message),
    } }).parseFromString(source, 'image/svg+xml');
    if (issues.length || !xml.documentElement) throw new Error('invalid SVG XML');
    const root = xml.documentElement;
    if (root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) throw new Error('expected SVG root element');
    const roots = Array.from({length: xml.childNodes.length}, (_, i) => xml.childNodes.item(i));
    if (roots.filter(node => node?.nodeType === 1).length !== 1 || roots.some(node => node?.nodeType === 3 && node.nodeValue?.trim())) throw new Error('invalid SVG XML');
    const rootAttrs = this.attributes(root);
    for (const key of Object.keys(rootAttrs)) if (!['width','height','viewBox','xmlns','version'].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    const document = new SvgDocument(rootAttrs.width === undefined ? 800 : Number(rootAttrs.width), rootAttrs.height === undefined ? 600 : Number(rootAttrs.height));
    if (rootAttrs.viewBox !== undefined) {
      const view = rootAttrs.viewBox.trim().split(/[\s,]+/).map(Number);
      if (view.length !== 4 || view[0] !== 0 || view[1] !== 0 || view[2] !== document.width || view[3] !== document.height) throw new Error('unsupported SVG viewBox: expected 0 0 width height');
    }
    const explicitIds = new Set<string>();
    const inspect = (element: Element): void => {
      if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error('unsupported SVG namespace');
      const id = element.getAttribute('id');
      if (id) {
        if (explicitIds.has(id)) throw new Error(`id already exists: ${id}`);
        explicitIds.add(id);
      }
      this.elements(element).forEach(inspect);
    };
    this.elements(root).forEach(inspect);
    const warnings: string[] = [];
    const read = (element: Element): Shape => {
      const attrs = this.attributes(element), type = element.localName;
      let id = attrs.id;
      if (!id) {
        let index = 1;
        while (explicitIds.has(`${type}${index}`)) index++;
        id = `${type}${index}`; explicitIds.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.factory.fromAttributes(type, id, attrs, element.textContent ?? '');
      const children = this.elements(element);
      if (shape instanceof Group) {
        this.rejectNonWhitespace(element);
        for (const child of children) shape.insert(read(child));
      } else if (children.length) throw new Error(`unsupported nested content in <${type}>`);
      else if (shape.textContent === undefined) this.rejectNonWhitespace(element);
      return shape;
    };
    this.rejectNonWhitespace(root);
    for (const child of this.elements(root)) document.add(read(child));
    return { document, warnings };
  }
  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement;
    root.setAttribute('xmlns', this.namespace);
    root.setAttribute('width', String(document.width)); root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    const write = (shape: Shape): Element => {
      const element = xml.createElementNS(this.namespace, shape.tag);
      for (const [key, value] of Object.entries(shape.attributes)) element.setAttribute(key, value);
      if (shape.textContent !== undefined) element.appendChild(xml.createTextNode(shape.textContent));
      for (const child of shape.children) element.appendChild(write(child));
      return element;
    };
    for (const shape of document.children) root.appendChild(write(shape));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }
  private attributes(element: Element): Record<string, string> {
    const result: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i)!;
      result[attr.name] = attr.value;
    }
    return result;
  }
  private elements(element: Element): Element[] {
    const result: Element[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes.item(i)!;
      if (node.nodeType === 1) result.push(node as Element);
    }
    return result;
  }
  private rejectNonWhitespace(element: Element): void {
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes.item(i)!;
      if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim()) throw new Error(`unsupported text in <${element.localName}>`);
    }
  }
}
