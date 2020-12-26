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
  addTopLevel(graph, visitorsResult.topLevelData);
  addBindings(graph, visitorsResult.bindings);
  let g = graph.execute();
  return graphlib.json.write(g);
}

function addBindings(graph, bindings) {
  bindings.forEach((x) => {
    let tag = x[0];
    let boundItems = x[1];
    let tagNode = new Node(tag.id, tag.name, { loc: tag.loc, type: "tag" });
    graph.addNode(tagNode);
    boundItems.forEach((y) => {
      let item = y.item;
      let bindingType = y.bindingType;
      //TODO doesn't respect positions
      let last = addIdentifierChain(graph, item);
      addEdgeBasedOnType(graph, tagNode, last, bindingType);

      //TODO need to add linke from "problems[i]" to "problems"
      //TODO need to add tests with nested problems[i][j] type access
    });
  });
}
function addTopLevel(graph, topLevel) {
  topLevel.forEach((x) => x.id.identifiers.unshift({ name: "this" }));
  topLevel.forEach((topLevel) => addIdentifierChain(graph, topLevel));
}

function addIdentifierChain(graph, x, opts = undefined) {
  let nodes = identifierChainToNodes(x.id.identifiers, opts);

  nodes.forEach((x) => graph.addNode(x));
  graph.connect(nodes);

  return lodash.last(nodes);
}

function identifierChainToNodes(identifiers, opts) {
  console.log(identifiers);
  //  identifiers.map((x) => [x.name, x.positions.map((x) => x.name)]).flat();
  let prev = [];
  let nodes = identifiers
    .map((last) => {
      prev = prev.concat(last);
      let node = new Node(
        IdentifierChain.toString(prev),
        Identifier.toString(last),
        opts
      );
      return node;
    })
    .flat();
  return nodes;
}

function addEdgeBasedOnType(graph, tag, item, type) {
  switch (type) {
    case bindingType.EVENT:
      graph.addEdge(tag, item, { type: bindingType.EVENT });
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

module.exports = { compute };
