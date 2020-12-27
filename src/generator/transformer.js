const { ExtendedGraph } = require("./graph.js");
const graphlib = require("@dagrejs/graphlib");
const { bindingType } = require("../models/visitors.js");
const { Identifier, Identifiers } = require("../models/identifiers.js");
const { Node } = require("../models/graph.js");
const lodash = require("lodash");
function compute(visitorsResult) {
  let graph = new ExtendedGraph();
  addTopLevel(graph, visitorsResult.topLevelData);
  addBindings(graph, visitorsResult.bindings);
  addMethods(graph, visitorsResult.methods);
  let g = graph.execute();
  return graphlib.json.write(g);
}
function addMethods(graph, methods) {
  //console.log(methods);
}

function addBindings(graph, bindings) {
  bindings.forEach((x) => {
    let tag = x[0];
    let boundItems = x[1];
    let tagNode = new Node(tag.id, tag.name, { loc: tag.loc, type: "tag" });
    graph.addNode(tagNode);

    boundItems.forEach((y) => {
      let item = prefix(y.item);
      let last = addIdentifierChain(graph, item);
      addEdgeBasedOnType(graph, tagNode, last, y.bindingType);
    });
  });
}
function addTopLevel(graph, topLevel) {
  topLevel = prefixAll(topLevel);
  topLevel.forEach((topLevel) => addIdentifierChain(graph, topLevel));
}

function addIdentifierChain(graph, x, opts = undefined) {
  let nodes = identifierChainToNodes(x.id, opts);

  graph.addNodes(nodes);
  graph.connect(nodes);

  return lodash.last(nodes);
}

function prefix(acessor) {
  return { id: Identifiers.prefix(acessor.id, Identifier.createThis()) };
}

function prefixAll(acessors) {
  return acessors.map((a) => prefix(a));
}

function identifierChainToNodes(identifiers, opts) {
  let prev = [];
  let nodes = identifiers.map((current) => {
    let newNode = Identifier.isPosition(current)
      ? Identifier.createIdentifier(
          lodash.last(prev).name + Identifier.toString(current)
        )
      : current;

    prev = prev.concat(newNode);
    return new Node(
      Identifiers.toString(prev),
      Identifier.toString(newNode),
      opts
    );
  });
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
