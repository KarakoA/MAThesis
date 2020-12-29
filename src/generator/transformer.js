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
    visitorsResult.methods
      .concat(visitorsResult.computed)
      .concat(visitorsResult.init),
    visitorsResult.topLevelData
  );
  let isComputedF = isComputed(visitorsResult.computed);
  addTopLevel(graph, visitorsResult.topLevelData);
  addBindings(
    graph,
    methodResolver,
    visitorsResult.bindings,
    visitorsResult.init,
    isComputedF
  );

  resolveDifferentDisplays(graph);
  //addInit(graph, visitorsResult.methods);
  let g = graph.execute();

  return graphlib.json.write(g);
}

function isComputed(computed) {
  //TODO with proper equality can be more efficient
  let allComputed = computed.map((x) => x.name);
  return (item) => lodash.find(allComputed, (x) => lodash.isEqual(x, item));
}
function resolveDifferentDisplays(graph) {
  graph.numericPositions();
}

//TODO refactor (split up mainly)
function addBindings(graph, methodResolver, bindings, init, isComputedF) {
  //TODO keep track of those in method resolver?
  let methodsDone = [];
  let methodsToDo = [];
  bindings.forEach((x) => {
    let tag = x[0];
    let boundItems = x[1];
    let tagNode = new Node({
      id: tag.id,
      name: tag.name,
      opts: { loc: tag.loc, type: "tag" },
    });
    graph.addNode(tagNode);

    boundItems.forEach((binding) => {
      if (binding.item.type === "property") {
        if (isComputedF(binding.item.id)) {
          //TODO abstract
          let resolved = methodResolver.called({
            id: binding.item.id,
            args: [],
          });

          let node = methodLikeNode(resolved, "computed");
          methodsDone.push(node);
          methodsToDo = methodsToDo.concat(resolved.calls);
          addEdgesMethod(graph, node, resolved);

          addEdgeBasedOnType(graph, tagNode, node, binding.bindingType);
        } else {
          let item = prefix(binding.item);
          let last = addIdentifierChain(graph, item);
          addEdgeBasedOnType(graph, tagNode, last, binding.bindingType);
        }
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

  //TODO abstract
  let resolved = methodResolver.called({ id: init.name, args: init.args });
  //type:init
  let node = methodLikeNode(resolved, "init");
  //TODO can contain duplicates(not an issue, but proper equals would be great )
  methodsDone.push(node);
  methodsToDo = methodsToDo.concat(resolved.calls);

  addEdgesMethod(graph, node, resolved);

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
  callNodes.map((x) => graph.addEdge(node, x, { type: "calls" }));
}
//TODO better abstraction
function methodLikeNode(item, type) {
  let id = Identifiers.toString(item.id);
  let name = Identifiers.toString(item.id, false);

  return new Node({ id, name, opts: { type: type } });
}
function methodNode(method) {
  //
  let id = `${Identifiers.toString(method.id)}(${method.args
    //TODO @this.problems.push() is undefined only
    .map((arg) => (arg ? lodash.last(identifierChainToNodes(arg)).id : ""))
    .join(",")})`;
  let name = `${Identifiers.toString(
    method.id,
    false
  )}(${method.args.map((arg) => Identifiers.toString(arg, false)).join(",")})`;

  return new Node({ id, name, opts: { type: "method" } });
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
    let nodeName = Identifier.isPosition(current)
      ? Identifier.createIdentifier(
          lodash.last(prev).name + Identifier.toString(current)
        )
      : current;
    //TODO @check guaranteed to be only one?
    let parent = Identifiers.toString(prev);
    prev = prev.concat(nodeName);

    return new Node({
      id: Identifiers.toString(prev),
      name: Identifier.toString(nodeName),
      opts: { ...opts, type: current.type },
      parent,
    });
  });
  return nodes;
}

function addEdgeBasedOnType(graph, tag, item, type) {
  switch (type) {
    case bindingType.EVENT:
      graph.addEdge(tag, item, { type: bindingType.EVENT });
      break;
    case bindingType.ONE_WAY:
      graph.addEdge(item, tag);
      break;
    case bindingType.TWO_WAY:
      //TODO @maybe leave it at two way here an check later?
      graph.addEdge(tag, item, { type: bindingType.EVENT });
      graph.addEdge(item, tag);
      break;
    default:
      throw new Error(`Unknown binding type: ${type}!`);
  }
}

module.exports = { compute };
