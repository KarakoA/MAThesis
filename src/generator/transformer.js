const { ExtendedGraph } = require("./graph.js");
const graphlib = require("@dagrejs/graphlib");
function compute(visitorsResult) {
  let graph = new ExtendedGraph();
  let g = graph.execute();
  return graphlib.json.write(g);
}

module.exports = { compute };
