const { ExtendedGraph } = require("./graph.js");
const graphlib = require("@dagrejs/graphlib");
function compute(visitorsResult) {
  let graph = new ExtendedGraph();
  addTopLevel(graph, visitorsResult.topLevel);
  let g = graph.execute();
  return graphlib.json.write(g);
}

function addTopLevel(graph, topLevel) {
  // topLevel.map(x=>node  )
  graph.addNode();
}

module.exports = { compute };
