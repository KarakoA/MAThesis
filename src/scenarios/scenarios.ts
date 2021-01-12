import _ from "lodash/fp";
import { deserialize, ExtendedGraph } from "../generator2/graph";
import {
  EdgeType,
  isTagNode,
  TagNode,
  Node,
  isMethodNode,
} from "../generator2/models/graph";
import { JSObject, lift, nonNull } from "../utils";

type ScenarioSet = Scenario[];

type Scenario = Entry[];
class Entry {
  name: string;
  updates: string[];
  constructor(graph: ExtendedGraph, node: Node) {
    this.name = node.name;
    this.updates = l(graph, node).map((x) => x.name);
  }
}

export function computeAndPrintScenarios(jsonGraph: JSObject, depth = 3): void {
  const graph = deserialize(jsonGraph);

  const initNode = graph.init();
  const init = new Entry(graph, initNode);

  const edges = graph.edges();
  const eventEdgeSources = edges
    .filter((x) => x.label === EdgeType.EVENT)
    .map((x) => x.source);

  const clickableNodes = _.uniqWith(_.isEqual, eventEdgeSources);
  const clickable = clickableNodes.map((node) => new Entry(graph, node));

  const scenarios = createScenarios(init, clickable, depth);
  const uniqScenarios = uniqueScenarios(scenarios);

  [init, ...clickable]
    .map((x) => `l(${x.name}) -> ${x.updates.join(", ")}`)
    .map((x) => console.log(x));
  console.log();
  console.log(`Unique scenarios (A) of up to ${depth} elements:`);
  console.log(uniqueScenarios);

  uniqScenarios.map(print);
}

function uniqueScenarios(scenarios: ScenarioSet[]) {
  const deduplicatedScenarios = _.flatten(scenarios).map(deduplicate);
  const uniqScenarios = _.uniqWith(_.isEqual, deduplicatedScenarios);
  return uniqScenarios;
}
function deduplicate(scenario: Scenario) {
  return _.reduce(
    (x, y) => (_.isEqual(_.last(x), y) ? x : x.concat(y)),
    scenario,
    []
  );
}

function createScenarios(
  init: Entry,
  clickable: Entry[],
  depth: number
): ScenarioSet[] {
  let prev: ScenarioSet = [];
  const scenarios: ScenarioSet[] = [];
  const isClickable = function (name: string): Entry | undefined {
    return _.find((x) => x.name === name, clickable);
  };
  for (let i = 0; i <= depth; i++) {
    prev = createScenarioSet(init, clickable, prev, isClickable, i);
    scenarios.push(prev);
  }
  return scenarios;
}
function createScenarioSet(
  init: Entry,
  clickable: Entry[],
  prev: ScenarioSet,
  isClickable: (x: string) => Entry | undefined,
  i: number
): ScenarioSet {
  //initially only init
  if (_.isEmpty(prev)) return [[init]];
  //first time include all clickable, not only those reachable from last
  //represents user being able to press anything
  if (i == 1) return clickable.map((clickable) => [init, clickable]);

  return _.flatMap((prevScenario) => {
    //last of prev. scenario
    const last = nonNull(_.last(prevScenario));

    const clickables = _.flatMap((x) => lift(isClickable(x)), last.updates);
    return clickables.map((x) => prevScenario.concat(x));
  }, prev);
}

function print(scenario: Scenario): void {
  console.log(`Scenario: '${scenario.join("', '")}'`);

  const given = computeGiven(scenario);
  if (_.head(given)) console.log(`\tGiven '${_.head(given)}'`);
  _.tail(given)?.map((x) => console.log(`\tAnd '${x}'`));

  const when = computeWhen(scenario);
  console.log(`\tWhen '${when}'`);

  const then = computeThen(scenario);
  console.log(`\tThen '${_.head(then)}'`);
  _.tail(then)?.map((x) => console.log(`\tAnd '${x}'`));
  console.log();
}

function computeGiven(scenario: Scenario): string[] {
  const exceptLast = _.dropRight(1, scenario);
  return exceptLast.map((x) => x.name);
}
function computeWhen(scenario: Scenario): string {
  return nonNull(_.last(scenario)).name;
}
function computeThen(scenario: Scenario): string[] {
  return nonNull(_.last(scenario)).updates;
}

function nodeTriggerableByEvent(graph: ExtendedGraph, node: Node): boolean {
  const edges = graph.inEdges(node);
  return _.some((x) => x.label === EdgeType.EVENT, edges);
}

function traverse(
  graph: ExtendedGraph,
  node: Node,
  visited: Node[] = []
): Node[] {
  function alreadyVisited(node: Node): boolean {
    return !_.find(_.isEqual(node), visited);
  }

  function inner(id: Node) {
    if (alreadyVisited(node)) return;
    visited.push(id);

    const reachable = graph
      .outEdges(id)
      .filter((x) => x.label !== EdgeType.EVENT)
      .filter(
        //from Paper
        //"Note that updating the answer does not trigger $scope.check answer(), since this function needs explicit triggering via Check,"
        //is problematic, what if function is called from somewhere? that's why we need call relation
        (x) =>
          (isMethodNode(x.sink) && x.label === EdgeType.CALLS) ||
          !nodeTriggerableByEvent(graph, x.sink)
      )
      .map((x) => x.sink);

    // console.log(`traverse(${id}) -> ${reachable}`);
    reachable?.forEach(inner);
  }

  //inner is not allowed to travel event edges (and shouldn't be)
  const reachableByEvent = graph
    .outEdges(node)
    .filter((x) => x.label == EdgeType.EVENT);

  reachableByEvent.map((x) => inner(x.sink));
  return Array.from(visited);
}

function l(graph: ExtendedGraph, node: Node): TagNode[] {
  const preorder = traverse(graph, node);
  return _.filter(isTagNode, preorder);
}
