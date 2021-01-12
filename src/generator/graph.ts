import { Graph, json } from "graphlib";
import {
  DataNode,
  EdgeType,
  isDataNode,
  isTagNode,
  Node,
  Edge,
  NodeType,
  TagNode,
  IsInitNode,
} from "./models/graph";
import _ from "lodash/fp";
import {
  Identifier,
  isGenericIndex,
  isNumericIndex,
} from "../models/identifier";
import { lift, JSObject } from "../utils";

export class ExtendedGraph {
  graph: Graph;
  lastAddedNode?: Node;
  constructor() {
    this.graph = new Graph({
      directed: true,
      compound: true,
      multigraph: false,
    });
    this.lastAddedNode = undefined;
  }

  /**
   * Adds a node to the graph. If it already exists, the passed one is ignored (not overwritten)
   * @param node node to add
   */
  addNode(node: Node): void {
    this.lastAddedNode = node;
    if (!this.graph.hasNode(node.id)) {
      const label = node;
      this.graph.setNode(node.id, label);
      if (isDataNode(node) && node.parent) {
        this.graph.setParent(node.id, node.parent);
      }
    }
  }

  /**
   * Same as {@link #addNode()} but for multiple nodes
   * @param nodes
   */
  addNodes(nodes: Node[]): void {
    nodes.forEach((node) => this.addNode(node));
  }

  /**
   * Adds an edge from source to sink. If source or sink are not in the graph, they are added.
   * @param source from
   * @param sink to
   * @param label edge type
   */
  addEdge(source: Node, sink: Node, label: EdgeType = EdgeType.SIMPLE): void {
    this.addNode(source);
    this.addNode(sink);
    this.graph.setEdge(source.id, sink.id, label);
  }
  //TODO merge
  addEdge2(edge: Edge): void {
    this.addNode(edge.source);
    this.addNode(edge.sink);
    this.graph.setEdge(edge.source.id, edge.sink.id, edge.label);
  }

  /**
   * Connects the given nodes by adding edges between them with the given label.
   * @param nodes nodes to connect
   * @param label edge type
   * @example connect(["A","B","C"]) results in the following edges: A -> B, B-> C
   */
  connect(nodes: Node[], label: EdgeType = EdgeType.SIMPLE): void {
    _.zip(nodes, _.tail(nodes)).forEach(([source, sink]) => {
      if (source && sink) this.addEdge(source, sink, label);
    });
  }

  //TODO refactor this
  numericPositions(): void {
    const numerics = _.filter(
      (x) => isDataNode(x) && isNumericIndex(x.identifier),
      this.nodes()
    ).map((x) => x as DataNode);

    numerics.forEach((x) => this.process(x));
  }

  //TODO refactor this
  //connects ids of generic to the one of numeric
  process(numeric: DataNode): void {
    //get the parent of the numeric node
    const parent = numeric.parent;
    // should always be defined since a numeric index is always proceeded by named identifier
    if (!parent) throw new Error(`Parent of ${numeric} is not defined!`);
    //TODO @check could there be more (shouldn't be the case)

    //get all children of the parent
    const childDataNode = _.filter(isDataNode)(
      this.graph.children(parent).map((x) => this.node(x))
    );
    //only interested in those that are generic, should be only one
    //it matches the numeric one.
    //e.g if numeric is 0 and parent is problems (problems[0])
    //this would result in problems, i  (problems[i])
    const generic = childDataNode.find((x) => isGenericIndex(x.identifier));
    //TODO assert is only one, else something failed

    //TODO this might be alright, what if accessing without there being a list?
    //e.g. data[0] and no "for data[i]" <span>
    if (!generic)
      throw new Error(`Generic index does not exist in children of ${parent}!`);

    //problems[i].data.a
    // => node with id "problems[i].data.a"
    const oldNodes = this.getLastChildren(generic.id);

    //problems[i].data.a
    //  id: "problems[i].data.a", newId: "problems[0].data.a"
    const nodes = oldNodes.map((node) => {
      const newNode: DataNode = {
        id: node.id.replace(generic.id, numeric.id),
        name: node.name,
        discriminator: node.discriminator,
        parent: numeric.id,
        //TODO doublecheck
        identifier: node.identifier,
      };
      return { oldNode: node, newNode: newNode };
    });

    this.addNodes(nodes.map((x) => x.newNode));

    const newOutEdges = _.flatMap(
      (x) =>
        this.outEdges(x.oldNode).map((edge) => {
          return {
            source: x.newNode,
            sink: edge.sink,
            label: edge.label,
          } as Edge;
        }),
      nodes
    );
    const newInEdges = _.flatMap(
      (x) =>
        this.outEdges(x.oldNode).map((edge) => {
          return {
            source: edge.source == generic ? numeric : edge.source,
            sink: x.newNode,
            label: edge.label,
          } as Edge;
        }),
      nodes
    );
    const edges = newInEdges.concat(newOutEdges);
    edges.forEach((edge) => this.addEdge2(edge));
  }

  outEdges(node: string | Node): Edge[] {
    const nodeId = _.isString(node) ? node : node.id;
    const outEdges = this.graph.outEdges(nodeId);
    if (!outEdges) return [];
    return _.flatMap((x) => lift(this.edge(x.v, x.w)), outEdges);
  }

  inEdges(node: string | Node): Edge[] {
    const nodeId = _.isString(node) ? node : node.id;
    const inEdgesEdges = this.graph.inEdges(nodeId);
    if (!inEdgesEdges) return [];
    return _.flatMap((x) => lift(this.edge(x.v, x.w)), inEdgesEdges);
  }

  edge(source: string, sink: string): Edge | undefined {
    const label = this.graph.edge(source, sink);
    if (!label) return undefined;
    return {
      source: this.node(source),
      sink: this.node(sink),
      label: label as EdgeType,
    };
  }

  children(parent: string | Node): DataNode[] {
    const parentId = _.isString(parent) ? parent : parent.id;
    const children = this.graph.children(parentId).map((x) => this.node(x));
    //all of them are data node, only data nodes can have a parent
    return _.filter(isDataNode, children);
  }

  /**
   * Returns all indirect children of the given vertex.
   * Indirect children are defined as the children,
   * that can be reached via recursively calling .children on children of vertex.
   * @param vertex  the vertex
   */
  // indirectChildren(vertex: string): string[] {
  //   const directChildren = this.graph.children(vertex);
  //   if (lodash.isEmpty(directChildren)) {
  //     return [vertex];
  //   }

  //   //TODO can I inline?
  //   return _.flatMap((x) => this.indirectChildren(x), directChildren);
  // }
  //TODO fix doc, that's not what it does
  getLastChildren(vertex: string | DataNode): DataNode[] {
    const directChildren = this.children(vertex);
    if (_.isEmpty(directChildren)) {
      if (_.isString(vertex)) {
        const node = this.node(vertex);
        if (isDataNode(node)) return [node];
        else throw new Error(`${node} has to be a data node!`);
      }
      return [vertex];
    }

    //TODO can I inline?
    return _.flatMap((x) => this.getLastChildren(x), directChildren);
  }

  node(id: string): Node {
    return this.graph.node(id) as Node;
  }

  nodes(): Node[] {
    const nodes = this.graph.nodes().map((id) => this.node(id));
    return nodes;
  }

  edges(): Edge[] {
    const edges = this.graph.edges();
    const res = _.flatMap((x) => lift(this.edge(x.v, x.w)), edges);
    return res;
  }
  init(): Node {
    const initNodes = _.filter(IsInitNode, this.nodes());
    if (initNodes.length != 1)
      throw new Error(
        `Graph must contain exactly one init node! It contains ${initNodes.length} nodes!`
      );
    return initNodes[0];
  }
}

export function serialize(graph: ExtendedGraph): JSObject {
  return json.write(graph.graph) as JSObject;
}
export function deserialize(jsonData: JSObject): ExtendedGraph {
  const graphlibGraph = json.read(jsonData);
  const graph = new ExtendedGraph();
  graph.graph = graphlibGraph;
  return graph;
}
