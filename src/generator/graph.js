const { Graph } = require("@dagrejs/graphlib");
const { IdentifierChain } = require("../models/visitors.js");
const assert = require("assert");
const { Node } = require("../models/graph.js");
class ExtendedGraph {
  constructor() {
    this.graph = new Graph({
      directed: true,
      compound: false,
      multigraph: false,
    });
    this.nodesLater = [];
    this.edgesLater = [];
    this.lastAddedNode = undefined;
  }

  addNode(node) {
    this.lastAddedNode = node;
    assert(node instanceof Node);
    if (!this.graph.hasNode(node.id)) this.graph.setNode(node.id, node.label);
  }

  addEdge(source, sink, label = undefined) {
    this.addNode(source);
    this.addNode(sink);
    this.graph.setEdge(source.id, sink.id, label);
  }

  addNodeLater(node) {
    this.nodesLater.push(node);
  }
  addEdgeLater(source, sink, label) {
    this.edgesLater.push({ source, sink, label });
  }

  execute() {
    this.nodesLater.forEach((node) => this.addNode(node));
    this.edgesLater.forEach((x) =>
      this.addEdgeLater(x.source, x.sink, x.label)
    );
    return Object.freeze(this.graph);
  }
}
module.exports = { ExtendedGraph };
