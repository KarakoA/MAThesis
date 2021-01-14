import { IdentifierType } from "../../common/models/identifier";
import { Location } from "../../parsing/models/template-bindings";

export enum EdgeType {
  SIMPLE = "simple",
  EVENT = "event",
  CALLS = "calls",
}

export interface Edge {
  source: Node;
  sink: Node;
  label: EdgeType;
}

export enum NodeType {
  TAG = "tag",
  DATA = "data",
  METHOD = "method",
  INIT = "init",
}

export type Node = TagNode | DataNode | MethodNode | InitNode;

export function isTagNode(n: Node): n is TagNode {
  return n.discriminator === NodeType.TAG;
}
export function isDataNode(n: Node): n is DataNode {
  return n.discriminator === NodeType.DATA;
}

export function isMethodNode(n: Node): n is MethodNode {
  return n.discriminator === NodeType.METHOD;
}
export function IsInitNode(n: Node): n is InitNode {
  return n.discriminator === NodeType.INIT;
}

interface BaseNode {
  id: string;
  name: string;
}

export interface TagNode extends BaseNode {
  loc: Location;
  discriminator: NodeType.TAG;
}

export interface MethodNode extends BaseNode {
  discriminator: NodeType.METHOD;
}

export interface InitNode extends BaseNode {
  discriminator: NodeType.INIT;
}

export interface DataNode extends BaseNode {
  parent?: string;
  type: IdentifierType;
  discriminator: NodeType.DATA;
}

export function isGenericIndex(n: DataNode): boolean {
  return n.type === IdentifierType.GENERIC_INDEX;
}

export function isNumericIndex(n: DataNode): boolean {
  return n.type === IdentifierType.NUMERIC_INDEX;
}

//#region  Factory Methods

export function edge(
  source: Node,
  sink: Node,
  label: EdgeType | undefined = undefined
): Edge {
  return { source, sink, label: label ?? EdgeType.SIMPLE };
}

export function tag(
  id: string,
  loc: Location | undefined = undefined,
  name: string | undefined = undefined
): TagNode {
  return {
    id,
    name: name ?? id,
    loc: loc ?? {
      start: { line: -1, column: -1 },
      end: { line: -1, column: -1 },
    },
    discriminator: NodeType.TAG,
  };
}
export function method(
  id: string,
  name: string | undefined = undefined
): MethodNode {
  return { id, name: name ?? id, discriminator: NodeType.METHOD };
}
export function init(
  id: string,
  name: string | undefined = undefined
): InitNode {
  return { id, name: name ?? id, discriminator: NodeType.INIT };
}

export function data(
  id: string,
  parent: string | undefined = undefined,
  type: IdentifierType = IdentifierType.NAME_IDENTIFIER,
  name: string | undefined = undefined
): DataNode {
  return { id, name: name ?? id, type, discriminator: NodeType.DATA, parent };
}
//#endregion
