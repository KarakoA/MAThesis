const { ExtendedGraph } = require("./graph.js");
const graphlib = require("@dagrejs/graphlib");
const { bindingType } = require("../models/visitors.js");
const { Identifier, Identifiers } = require("../models/identifiers.js");
const { Node } = require("../models/graph.js");
const lodash = require("lodash");
const { MethodResolver } = require("./method-resolver.js");
function compute(visitorsResult) {
  let graph = new ExtendedGraph();
  let methodResolver = new MethodResolver(
    visitorsResult.methods,
    visitorsResult.topLevelData
  );
  addTopLevel(graph, visitorsResult.topLevelData);
  addBindings(graph, methodResolver, visitorsResult.bindings);
  console.log(visitorsResult.bindings);
  console.log(visitorsResult.computed);
  //addMethods(graph, visitorsResult.methods);
  let g = graph.execute();
  return graphlib.json.write(g);
}
function addMethods(graph, methods) {
  //console.log(methods);
}

function addBindings(graph, methodResolver, bindings) {
  //TODO keep track of those in method resolver?
  let methodsDone = [];
  let methodsToDo = [];
  bindings.forEach((x) => {
    let tag = x[0];
    let boundItems = x[1];
    let tagNode = new Node(tag.id, tag.name, { loc: tag.loc, type: "tag" });
    graph.addNode(tagNode);

    boundItems.forEach((binding) => {
      if (binding.item.type === "property") {
        let item = prefix(binding.item);
        let last = addIdentifierChain(graph, item);
        addEdgeBasedOnType(graph, tagNode, last, binding.bindingType);
      }
      if (binding.item.type === "method") {
        //TODO abstract
        let resolved = methodResolver.called(binding.item);
        let node = methodNode(resolved);
        methodsDone.push(node);
        methodsToDo = methodsToDo.concat(resolved.calls);
        addEdgesMethod(graph, node, resolved);

        addEdgeBasedOnType(graph, tagNode, node, binding.bindingType);
      }
    });
  });

  //TODO abstraction level
  //TODO simplify, if can use proper equals this is just a contains query
  while (
    !(
      lodash.isEmpty(methodsToDo) ||
      lodash.every(methodsToDo, (todo) =>
        lodash.some(methodsDone, (done) =>
          lodash.isEqual(done.id, methodNode(todo).id)
        )
      )
    )
  ) {
    let item = methodsToDo.pop();
    let resolved = methodResolver.called(item);
    if (resolved) {
      let node = methodNode(resolved);
      methodsDone.push(node);
      methodsToDo = methodsToDo.concat(resolved.calls);
      addEdgesMethod(graph, node, resolved);
    }
  }
}

function addEdgesMethod(graph, node, resolved) {
  let readNodes = resolved.reads.map((x) => addIdentifierChain(graph, x));
  readNodes.map((x) => graph.addEdge(x, node));

  let writeNodes = resolved.writes.map((x) => addIdentifierChain(graph, x));
  writeNodes.map((x) => graph.addEdge(node, x));

  let callNodes = resolved.calls.map(methodNode);
  callNodes.map((x) => graph.addEdge(node, x));
}
function methodNode(method) {
  let id = `${Identifiers.toString(method.id)}(${method.args
    .map((arg) => Identifiers.toString(arg))
    .join(",")})`;
  let name = `${Identifiers.toString(
    method.id,
    false
  )}(${method.args.map((arg) => Identifiers.toString(arg, false)).join(",")})`;

  return new Node(id, name);
}
function addTopLevel(graph, topLevel) {
  topLevel = prefixAll(topLevel);
  topLevel.forEach((topLevel) => addIdentifierChain(graph, topLevel));
}

function addIdentifierChain(graph, x, opts = undefined) {
  let nodes = identifierChainToNodes(x.id ?? x, opts);

  graph.addNodes(nodes);
  graph.connect(nodes);

  return lodash.last(nodes);
}

function prefix(acessor) {
  return { id: Identifiers.prefixThis(acessor.id) };
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
