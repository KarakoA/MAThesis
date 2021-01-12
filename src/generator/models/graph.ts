import { Identifier } from "../../models2/identifier";
import { Location } from "../../parsing/models/template-bindings";

export enum EdgeType {
  SIMPLE = "simple",
  EVENT = "event",
  CALLS = "calls",
}

export enum NodeType {
  TAG = "tag",
  DATA = "data",
  METHOD = "method",
  INIT = "init",
}

export interface Edge {
  source: Node;
  sink: Node;
  label: EdgeType;
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

export interface DataNode extends BaseNode {
  parent?: string;
  identifier: Identifier;
  discriminator: NodeType.DATA;
}
export interface MethodNode extends BaseNode {
  discriminator: NodeType.METHOD;
}

export interface InitNode extends BaseNode {
  discriminator: NodeType.INIT;
}
