import { Graph, json } from "graphlib";
import {
  DataNode,
  EdgeType,
  isDataNode,
  Node,
  Edge,
  IsInitNode,
  isGenericIndex,
  isNumericIndex,
  InitNode,
} from "./models/graph";
import _ from "lodash/fp";
import { lift, JSObject } from "../common/utils";

//#region Serialization
/**
 * Converts the given graph to a a stringifyable json object (serialize)
 * @param graph the graph
 */
export function serialize(graph: ExtendedGraph): JSObject {
  return json.write(graph.graph) as JSObject;
}
/**
 * Reads the graph from a serialized json object
 * @param jsonData serialized graph
 */
export function deserialize(jsonData: JSObject): ExtendedGraph {
  const graphlibGraph = json.read(jsonData);
  const graph = new ExtendedGraph();
  graph.graph = graphlibGraph;
  return graph;
}
//#endregion

/**
 * Encapsulates a compound and directed graph with some additional methods.
 */
export class ExtendedGraph {
  graph: Graph;
  constructor() {
    this.graph = new Graph({
      directed: true,
      compound: true,
      multigraph: false,
    });
  }

  //#region Add Nodes/Edges
  /**
   * Adds a node to the graph. If it already exists, the passed one is ignored (not overwritten)
   * @param node node to add
   */
  addNode(node: Node): void {
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
   * @param edge edge
   */
  addEdge(edge: Edge): void {
    this.addNode(edge.source);
    this.addNode(edge.sink);
    this.graph.setEdge(edge.source.id, edge.sink.id, edge.label);
  }

  /**
   * Same as {@link #addEdge()} but for multiple edges
   * @param edges
   */
  addEdges(edges: Edge[]): void {
    edges.forEach((edge) => this.addEdge(edge));
  }

  /**
   * Connects the given nodes by adding edges between them with the given label.
   * @param nodes nodes to connect
   * @param label edge type
   * @example connect(["A","B","C"]) results in the following edges: A -> B, B-> C
   */
  connect(nodes: Node[], label: EdgeType = EdgeType.SIMPLE): void {
    _.zip(nodes, _.tail(nodes)).forEach(([source, sink]) => {
      if (source && sink) this.addEdge({ source, sink, label });
    });
  }

  //#endregion

  //#region Query Nodes/Edges

  /**
   * Returns the given edge between source and sink or undefined if there is none
   * @param source from
   * @param sink to
   */
  edge(source: string, sink: string): Edge | undefined {
    const label = this.graph.edge(source, sink);
    if (!label) return undefined;
    return {
      source: this.node(source),
      sink: this.node(sink),
      label: label as EdgeType,
    };
  }
  /**
   * Returns the node with the given id
   * @param id id of the node
   */
  node(id: string): Node {
    return this.graph.node(id) as Node;
  }

  /**
   * Returns the outgoing edges from the given node
   * @param node node id string or node
   */
  outEdges(node: string | Node): Edge[] {
    const nodeId = this.nodeID(node);
    const outEdges = this.graph.outEdges(nodeId);
    if (!outEdges) return [];
    return _.flatMap((x) => lift(this.edge(x.v, x.w)), outEdges);
  }

  /**
   * Returns the incoming edges to the given node
   * @param node node id string or node
   */
  inEdges(node: string | Node): Edge[] {
    const nodeId = this.nodeID(node);
    const inEdgesEdges = this.graph.inEdges(nodeId);
    if (!inEdgesEdges) return [];
    return _.flatMap((x) => lift(this.edge(x.v, x.w)), inEdgesEdges);
  }

  /**
   * Returns the children of the given node.
   * Note that only DataNodes can be children/have children.
   * @param parent node whose children to return
   */
  children(parent: string | DataNode): DataNode[] {
    const parentId = this.nodeID(parent);
    const children = this.graph.children(parentId).map((x) => this.node(x));
    //all of them are data node, only data nodes can have a parent
    return _.filter(isDataNode, children);
  }

  parents(nodes: DataNode[]): DataNode[] {
    const parents = _.flatMap((x) => lift(x.parent), nodes).map(
      (x) => this.graph.node(x) as DataNode
    );
    const parentsUniq = _.uniqWith(_.isEqual, parents);
    return parentsUniq;
  }
  /**
   * Returns the generic child node.
   * A generic node can have multiple numeric nodes, but a numeric node can
   * have only one generic one.
   *
   * It is possible for a numeric node to not have any matching generic one. This is the case if
   * there is no generic binding to it(not used inside a v-for expression).
   *
   * @param numeric numeric node
   * @example the generic node to this.problems[0] is this.problems[i].
   */
  genericChildNode(node: DataNode): DataNode | undefined {
    //get all children of the node
    const childDataNode = this.children(node);

    const generic = childDataNode.filter(isGenericIndex);
    if (generic.length > 1)
      throw new Error(
        `There can be only one generic node! Found multiple for ${node.id}`
      );
    return _.head(generic);
  }

  numericChildren(node: DataNode): DataNode[] {
    return this.children(node).filter(isNumericIndex);
  }

  nameChildren(node: DataNode): DataNode[] {
    return this.children(node).filter(
      (x) => !(isGenericIndex(x) || isNumericIndex(x))
    );
  }
  //#endregion

  //#region Fetch
  /**
   * Returns all nodes
   */
  nodes(): Node[] {
    const nodes = this.graph.nodes().map((id) => this.node(id));
    return nodes;
  }

  /**
   * Returns all edges
   */
  edges(): Edge[] {
    const edges = this.graph.edges();
    const res = _.flatMap((x) => lift(this.edge(x.v, x.w)), edges);
    return res;
  }
  /**
   * Returns the init node or throws an exception if there is none or there is more than one.
   */
  init(): InitNode {
    const initNodes = _.filter(IsInitNode, this.nodes());
    if (initNodes.length != 1)
      throw new Error(
        `Graph must contain exactly one init node! It contains ${initNodes.length} nodes!`
      );
    return initNodes[0];
  }

  /**
   * Returns all data nodes, which are numeric indices.
   */
  IndexDataNodes(): DataNode[] {
    const indexes = _.filter(
      (x) => isDataNode(x) && (isNumericIndex(x) || isGenericIndex(x)),
      this.nodes()
    ).map((x) => x as DataNode);
    return indexes;
  }
  //#endregion

  //#region Helper Methods

  private getDataNode(node: string | DataNode): DataNode {
    if (_.isString(node)) {
      const dataNode = this.node(node);
      if (isDataNode(dataNode)) return dataNode;
      else throw new Error(`${dataNode} has to be a data node!`);
    }
    return node;
  }
  private nodeID(nodeOrId: string | Node): string {
    return _.isString(nodeOrId) ? nodeOrId : nodeOrId.id;
  }

  //#endregion
}
