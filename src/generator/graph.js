const { Graph } = require("@dagrejs/graphlib");
class ExtendedGraph {
  constructor(idFunction) {
    this.graph = new Graph({
      directed: true,
      compound: false,
      multigraph: false,
    });
    this.idFunction = idFunction;
    this.nodesLater = [];
    this.edgesLater = [];
  }

  addNode(node) {
    this.graph.setNode(this.idFunction(node), node);
  }

  addEdge(source, sink, label) {
    this.addNode(this.idFunction(source));
    this.addNode(this.idFunction(sink));
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
