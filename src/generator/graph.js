import { Graph } from "@dagrejs/graphlib";
//import { Identifiers } from "../models/visitors";
import assert from "assert";
import { Node } from "../models/graph";
import lodash from "lodash";
import { identifierTypes } from "../models/identifiers";
export class ExtendedGraph {
  constructor() {
    this.graph = new Graph({
      directed: true,
      compound: true,
      multigraph: false,
    });
    this.lastAddedNode = undefined;
  }

  addNode(node) {
    this.lastAddedNode = node;
    assert(node instanceof Node);
    if (!this.graph.hasNode(node.id)) {
      this.graph.setNode(node.id, node.label);
      if (node.parent) {
        this.graph.setParent(node.id, node.parent);
      }
    }
  }

  addNodes(nodes) {
    nodes.forEach((node) => this.addNode(node));
  }

  addEdge(source, sink, label = undefined) {
    this.addNode(source);
    this.addNode(sink);
    this.graph.setEdge(source.id, sink.id, label);
  }

  //adds edges between all adjacent nodes
  connect(nodes, label = undefined) {
    lodash.zip(nodes, lodash.tail(nodes)).forEach((x) => {
      if (x[1]) this.addEdge(x[0], x[1], label);
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
  indirectChildren(node) {
    let directChildren = this.graph.children(node);
    if (lodash.isEmpty(directChildren)) {
      return node;
    }

    return directChildren.map((x) => this.indirectChildren(x, node));
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
}
