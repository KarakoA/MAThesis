//import { Location } from "../../parsing/models/template-bindings";

import { Location, Tag } from "../../parsing/models/template-bindings";

// export class Node {
//   constructor({ id, name, opts = undefined, parent = undefined }) {
//     this.id = id;
//     this.parent = parent;
//     this.label = { name, opts };
//   }
// }

export enum EdgeType {
  SIMPLE = "simple",
  EVENT = "event",
  CALLS = "calls",
}

export enum NodeType {
  TAG = "tag",
  DATA = "data",
  METHOD = "method",
}

export type Node = TagNode | DataNode | MethodNode;

export function isTagNode(n: Node): n is TagNode {
  return n.discriminator === NodeType.TAG;
}
export function isDataNode(n: Node): n is DataNode {
  return n.discriminator === NodeType.DATA;
}

export function isMethodNode(n: Node): n is MethodNode {
  return n.discriminator === NodeType.METHOD;
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
  parent: string;
  discriminator: NodeType.DATA;
}
export interface MethodNode extends BaseNode {
  discriminator: NodeType.METHOD;
}
