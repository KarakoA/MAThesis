import { ExtendedGraph } from "./graph";
import graphlib from "graphlib";
import { Identifier, Identifiers } from "../models/identifiers";
import { Node } from "../models/graph";
import _ from "lodash/fp";
import { MethodResolver } from "./method-resolver";
import { Result } from "../parsing/models/result";
import { MethodDefintitions, MethodDefintion } from "../parsing/models/methods";
import { BindingsResult } from "../parsing/models/template-bindings";
import { isMethod, isProperty } from "../parsing/models/shared";
export function compute(visitorsResult: Result): Object {
  const graph = new ExtendedGraph();
  const methodResolver = new MethodResolver(
    visitorsResult.methods,
    visitorsResult.topLevel
  );
  const isComputedF = isComputed(visitorsResult.methods.computed);
  addTopLevel(graph, visitorsResult.topLevel);
  addBindings(
    graph,
    methodResolver,
    visitorsResult.bindings,
    isComputedF,
    visitorsResult.methods.init
  );

  resolveDifferentDisplays(graph);
  const g = graph.execute();

  return graphlib.json.write(g);
}

function isComputed(computed: MethodDefintitions): (x: Identifiers) => boolean {
  //TODO with proper equality can be more efficient
  const computedIds = computed.map((x) => x.id);
  return (item: Identifiers) => {
    return _.find(_.isEqual(item), computedIds) !== undefined;
  };
}
function resolveDifferentDisplays(graph: ExtendedGraph) {
  graph.numericPositions();
}

//TODO refactor (split up mainly)
function addBindings(
  graph: ExtendedGraph,
  methodResolver: MethodResolver,
  bindings: BindingsResult,
  isComputedF: (x: Identifiers) => boolean,
  init?: MethodDefintion
) {
  //TODO keep track of those in method resolver?
  let methodsDone = [];
  let methodsToDo = [];
  Array.from(bindings.bindings).forEach(([tag, boundItems]) => {
    const tagNode = new Node({
      id: tag.id,
      name: tag.name,
      opts: { loc: tag.loc, type: "tag" },
    });
    graph.addNode(tagNode);

    boundItems.forEach((binding) => {
      if (isProperty(binding.item)) {
        if (isComputedF(binding.item.id)) {
          //TODO abstract
          const resolved = methodResolver.called({
            id: binding.item.id,
            args: [],
          });

          const node = methodLikeNode(resolved, "computed");
          methodsDone.push(node);
          methodsToDo = methodsToDo.concat(resolved.calls);
          addEdgesMethod(graph, node, resolved);

          addEdgeBasedOnType(graph, tagNode, node, binding.bindingType);
        } else {
          const item = prefix(binding.item);
          const last = addIdentifierChain(graph, item);
          addEdgeBasedOnType(graph, tagNode, last, binding.bindingType);
        }
      }
      if (isMethod(binding.item)) {
        //TODO abstract
        const resolved = methodResolver.called(binding.item);
        const node = methodNode(resolved);
        methodsDone.push(node);
        methodsToDo = methodsToDo.concat(resolved.calls);
        addEdgesMethod(graph, node, resolved);

        addEdgeBasedOnType(graph, tagNode, node, binding.bindingType);
      }
    });
  });

  //TODO abstract
  const resolved = methodResolver.called({ id: init.name, args: init.args });
  //type:init
  const node = methodLikeNode(resolved, "init");
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
    const item = methodsToDo.pop();
    const resolved = methodResolver.called(item);
    if (resolved) {
      const node = methodNode(resolved);
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
      graph.addEdge(tag, item, { type: bindingType.EVENT });
      graph.addEdge(item, tag);
      break;
    default:
      throw new Error(`Unknown binding type: ${type}!`);
  }
}
