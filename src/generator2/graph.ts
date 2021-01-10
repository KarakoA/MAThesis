import { Graph } from "graphlib";
import {
  EdgeType,
  isDataNode,
  isTagNode,
  Node,
  NodeType,
} from "./models/graph";
import lodash from "lodash";
import _ from "lodash/fp";
import { identifierTypes } from "../models/identifiers";
import { Location } from "../parsing/models/template-bindings";

interface NodeLabel {
  name: string;
  type: NodeType;
  loc?: Location;
}
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
      const label = this.getLabel(node);
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

  /**
   * Connects the given nodes by adding edges between them with the given label.
   * @param nodes nodes to connect
   * @param label edge type
   * @example connect(["A","B","C"]) results in the following edges: A -> B, B-> C
   */
  connect(nodes: Node[], label: EdgeType = EdgeType.SIMPLE): void {
    _.zip(nodes, _.tail(nodes)).forEach(([a, b]) => {
      if (a && b) this.addEdge(a, b, label);
    });
  }

  //TODO refactor this
  numericPositions() {
    let numerics = this.nodesWithLabels().filter(
      (x) => x.opts?.type === identifierTypes.NUMERIC_POSITION
    );
    numerics.map((x) => this.process(x));
  }

  //TODO refactor this
  process(numeric) {
    let parent = this.graph.parent(numeric.id);
    //TODO @check could there be more (shouldn't be the case)
    let generic = this.graph
      .children(parent)
      .map((x) => this.nodeWithLabels(x))
      .find((x) => x.opts.type === identifierTypes.GENERIC_POSITION);
    let oldIds = this.indirectChildren(generic.id);

    let ids = oldIds.map((id) => {
      return { id, newId: id.replace(generic.id, numeric.id) };
    });

    let nodes = ids.map((x) => {
      return new Node({
        ...this.graph.node(x.id),
        id: x.newId,
        parent: numeric.id,
      });
    });

    this.addNodes(nodes);

    //TODO labels not set ( not used(can't be events), but this)
    let newOutEdges = ids.map((x) =>
      this.graph.outEdges(x.id).map((edge) => {
        return { v: x.newId, w: edge.w };
      })
    );
    let newInEdges = ids.map((x) =>
      this.graph.inEdges(x.id).map((edge) => {
        return { v: edge.v === generic.id ? numeric.id : edge.v, w: x.newId };
      })
    );
    let flat = lodash.flattenDeep(newInEdges.concat(newOutEdges));
    flat.forEach((x) => this.graph.setEdge(x.v, x.w));
  }

  neighborsWithoutParent(node, parent) {
    return lodash.without(this.graph.neighbors(node), parent);
  }

  indirectChildren(vertex: string): string[] {
    const directChildren = this.graph.children(vertex);
    if (lodash.isEmpty(directChildren)) {
      return [vertex];
    }

    //TODO can I inline?
    return _.flatMap((x) => this.indirectChildren(x), directChildren);
  }

  //TODO parent not set
  //instead use models.Node everywhere
  nodeWithLabels(id) {
    return { id, ...this.graph.node(id) };
  }

  nodesWithLabels() {
    let nodes = this.graph.nodes().map((id) => this.nodeWithLabels(id));
    return nodes;
  }

  execute() {
    return Object.freeze(this.graph);
  }

  private getLabel(node: Node): NodeLabel {
    return {
      name: node.name,
      type: node.discriminator,
      loc: isTagNode(node) ? node.loc : undefined,
    };
  }
}
