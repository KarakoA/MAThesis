import _ from "lodash/fp";
import { ExtendedGraph } from "../generator/graph";
import {
  EdgeType,
  isTagNode,
  TagNode,
  Node,
  isMethodNode,
} from "../generator/models/graph";
import { lift, nonNull } from "../common/utils";

interface InternalNode {
  name: string;
  id: string;
}

type ScenarioSet = Scenario[];

type Scenario = Entry[];
class Entry {
  node: InternalNode;
  updates: InternalNode[];
  constructor(graph: ExtendedGraph, node: Node) {
    this.node = { name: node.name, id: node.id };
    this.updates = l(graph, node).map((x) => {
      return { name: x.name, id: x.id };
    });
  }
}

export function computeAndPrintScenarios(
  graph: ExtendedGraph,
  depth = 4
): void {
  const initNode = graph.init();
  const init = new Entry(graph, initNode);

  const edges = graph.edges();
  const eventEdgeSources = edges
    .filter((x) => x.label === EdgeType.EVENT)
    .map((x) => x.source);

  const clickableNodes = _.uniqWith(_.isEqual, eventEdgeSources);
  const clickable = clickableNodes.map((node) => new Entry(graph, node));

  const scenarios = _.uniqWith(
    _.isEqual,
    _.flatten(createScenarios(init, clickable, depth))
  );

  [...clickable, init]
    .map(
      (x) => `l(${x.node.name}) -> ${x.updates.map((x) => x.name).join(", ")}`
    )
    .map((x) => console.log(x));
  console.log();
  console.log(`Unique scenarios (A) of up to ${depth} elements:`);
  console.log(scenarios.map((x) => x.map((x) => x.node.name)));

  scenarios.map(print);
}

function createScenarios(
  init: Entry,
  clickable: Entry[],
  depth: number
): ScenarioSet[] {
  let prev: ScenarioSet = [];
  const scenarios: ScenarioSet[] = [];
  const isClickable = function (node: InternalNode): Entry | undefined {
    return _.find((x) => x.node.id === node.id, clickable);
  };
  for (let i = 0; i < depth; i++) {
    prev = createScenarioSet(init, clickable, prev, isClickable, i);
    scenarios.push(prev);
  }
  return scenarios;
}
function createScenarioSet(
  init: Entry,
  clickable: Entry[],
  prev: ScenarioSet,
  isClickable: (x: InternalNode) => Entry | undefined,
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
    const clickableNeqLast = clickables.filter((x) => !_.isEqual(x, last));
    return clickableNeqLast.map((x) => prevScenario.concat(x));
  }, prev);
}

function print(scenario: Scenario): void {
  console.log(`Scenario: ['${scenario.map((x) => x.node.name).join("', '")}']`);

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
  return exceptLast.map((x) => x.node.name);
}
function computeWhen(scenario: Scenario): string {
  return nonNull(_.last(scenario)).node.name;
}
function computeThen(scenario: Scenario): string[] {
  return nonNull(_.last(scenario)).updates.map((x) => x.name);
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
  function alreadyVisited(id: Node): boolean {
    return _.find(_.isEqual(id), visited) !== undefined;
  }

  function inner(id: Node) {
    if (alreadyVisited(id)) return;
    visited.push(id);

    const reachable = graph
      .outEdges(id)
      .filter((x) => {
        //from Paper
        //"Note that updating the answer does not trigger $scope.check answer(), since this function needs explicit triggering via Check,"
        //is problematic, what if function is called from somewhere? that's why we need call relation

        //NOTE possible without calls (need to also check  if source and sink are both methods and let through)
        switch (x.label) {
          case EdgeType.EVENT:
            return false;
          case EdgeType.CALLS:
            return true;
          case EdgeType.SIMPLE:
            //current is not a method, but sink is and it's triggerable by event
            if (isMethodNode(x.sink) && nodeTriggerableByEvent(graph, x.sink)) {
              return false;
              //property chain or tag or reads relation
            } else return true;
        }
      })

      .map((x) => x.sink);

    //  console.log(`traverse(${id.id}) -> ${reachable.map((x) => x.id)}`);
    reachable?.forEach(inner);
  }

  //inner is not allowed to travel event edges (and shouldn't be)
  //that's why events are traversed here
  const reachableFromNodeByAnyMeans = graph.outEdges(node);

  //if (node.name !== "created") return [];
  reachableFromNodeByAnyMeans.forEach((x) => inner(x.sink));
  return Array.from(visited);
}

function l(graph: ExtendedGraph, node: Node): TagNode[] {
  const preorder = traverse(graph, node);

  return _.filter(isTagNode, preorder);
}
