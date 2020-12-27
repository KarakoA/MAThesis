const { Graph } = require("@dagrejs/graphlib");
//const { Identifiers } = require("../models/visitors.js");
const assert = require("assert");
const { Node } = require("../models/graph.js");
const lodash = require("lodash");
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
    lodash.zip(nodes, nodes.slice(1)).forEach((x) => {
      if (x[1]) this.addEdge(x[0], x[1], label);
    });
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
