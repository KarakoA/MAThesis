const { ExtendedGraph } = require("./graph.js");
const graphlib = require("@dagrejs/graphlib");
const {
  IdentifierChain,
  Identifier,
  bindingType,
} = require("../models/visitors.js");
const { Node } = require("../models/graph.js");
const lodash = require("lodash");
function compute(visitorsResult) {
  let graph = new ExtendedGraph();
  //addTopLevel(graph, visitorsResult.topLevelData);
  addBindings(graph, visitorsResult.bindings);
  let g = graph.execute();
  return graphlib.json.write(g);
}

function addBindings(graph, bindings) {
  //console.log(bindings[0][1]);
  bindings.forEach((x) => {
    let tag = x[0];
    let boundItems = x[1];
    let tagNode = new Node(tag.id, tag.name);
    graph.addNode(tagNode);
    boundItems.forEach((y) => {
      let item = y.item;
      let bindingType = y.bindingType;
      //TODO doesn't respect positions
      let last = addIdentifierChain(graph, item);
      addEdgeBasedOnType(graph, tag, last, bindingType);
    });
  });
}
function addEdgeBasedOnType(graph, tag, item, type) {
  switch (type) {
    case bindingType.EVENT:
      graph.addEdge(tag, item, bindingType.EVENT);
      break;
    case bindingType.ONE_WAY:
      graph.addEdge(tag, item);
      break;
    case bindingType.TWO_WAY:
      graph.addEdge(tag, item);
      graph.addEdge(item, tag);
      break;
    default:
      throw new Error(`Unknown binding type: ${type}!`);
  }
}
function addTopLevel(graph, topLevel) {
  topLevel.forEach((x) => x.id.identifiers.unshift({ name: "this" }));
  topLevel.forEach((topLevel) => addIdentifierChain(graph, topLevel));
}

function addIdentifierChain(graph, x) {
  let prev = [];
  let nodes = x.id.identifiers.map((last) => {
    prev = prev.concat(last);

    let node = new Node(
      IdentifierChain.toString(prev),
      Identifier.toString(last)
    );
    return node;
  });

  //TODO might be removable
  nodes.forEach((node) => graph.addNode(node));

  lodash.zip(nodes, nodes.slice(1)).forEach((x) => {
    if (x[1]) graph.addEdge(x[0], x[1]);
  });
  return lodash.last(nodes);
}

module.exports = { compute };
