const graphlib = require("@dagrejs/graphlib");
const lodash = require("lodash");
function computeScenarios(jsonGraph, depth = 3) {
  let graph = graphlib.json.read(jsonGraph);
  let nodes = graph.nodes().map((id) => {
    return { id, ...graph.node(id) };
  });
  let edges = graph.edges().map((edge) => {
    return { ...edge, ...graph.edge(edge) };
  });

  let initNode = lodash.first(nodes.filter((x) => x.opts?.type === "init"));

  let clickableNodes = lodash.uniqBy(
    edges
      .filter((x) => x.type === "event")
      .map((x) => {
        return {
          item: {
            id: x.v,
            ...graph.node(x.v),
          },
          //TODO @maybe refactor in nicer way. needed because "event" edges are not traversed
          sinkId: x.w,
        };
      }),
    (x) => x.item.id
  );
  let initWithLs = {
    name: initNode.name,
    updates: l(graph, initNode.id).map((x) => x.name),
  };

  let clickableWithLs = clickableNodes.map((node) => {
    return {
      name: node.item.name,
      updates: l(graph, node.sinkId).map((x) => x.name),
    };
  });

  let init = initWithLs.name;
  let clickable = clickableWithLs.map((node) => node.name);
  let ls = clickableWithLs.concat(initWithLs);
  let scenarios = createScenarios(init, clickable, ls, depth);
  let uniqScenarios = uniqueScenarios(scenarios);

  console.log(`Unique scenarios (A) of up to ${depth} elements:`);
  console.log(uniqScenarios);

  uniqScenarios.map((sc) => print(sc, ls));
}
function createScenarios(init, clickable, ls, depth) {
  let prev = [];
  let scenarios = [];
  for (let i = 0; i <= depth; i++) {
    prev = createScenarioSet(init, clickable, ls, prev, i);
    scenarios.push(prev);
  }
  return scenarios;
}
function uniqueScenarios(scenarios) {
  let sc = scenarios.flat().map(deduplicate);
  sc = lodash.uniqWith(sc, lodash.isEqual);
  return sc;
}
function deduplicate(scenario) {
  return lodash.reduce(
    scenario,
    (x, y) => (lodash.last(x) === y ? x : x.concat(y)),
    []
  );
}
function createScenarioSet(init, clickable, ls, prev, i) {
  if (lodash.isEmpty(prev)) {
    return [[init]];
  }
  //first time include all, not only those reachable from last
  if (i == 1) {
    return prev
      .map((prevScenario) =>
        lodash.compact(clickable.map((x) => prevScenario.concat(x)))
      )
      .flat();
  }

  return prev
    .map((prevScenario) => {
      let last = lodash.last(prevScenario);
      let lsLast = ls.find((x) => lodash.isEqual(last, x.name))?.updates;
      let newScenarios = clickable.map((x) =>
        lsLast.find((l) => lodash.isEqual(l, x))
          ? prevScenario.concat(x)
          : undefined
      );
      return lodash.compact(newScenarios);
    })
    .flat();
}

function print(scenario, ls) {
  console.log(`Scenario: '${scenario.join("', '")}'`);

  let given = computeGiven(scenario);
  if (lodash.head(given)) console.log(`\tGiven '${lodash.head(given)}'`);
  lodash.tail(given).map((x) => console.log(`\tAnd '${x}'`));

  let when = computeWhen(scenario);
  console.log(`\tWhen '${when}'`);

  let then = computeThen(scenario, ls);
  console.log(`\tThen '${lodash.head(then)}'`);
  lodash.tail(then).map((x) => console.log(`\tAnd '${x}'`));
  console.log();
}

function computeGiven(scenario) {
  return lodash.dropRight(scenario, 1);
}
function computeWhen(scenario) {
  return lodash.last(scenario);
}
function computeThen(scenario, ls) {
  let last = lodash.last(scenario);
  return ls
    .filter((x) => lodash.isEqual(last, x.name))
    .map((x) => x.updates)
    .flat();
}

function nodeTriggerableByEvent(graph, node) {
  let edges = graph.inEdges(node);

  //TODO NOTE collections map is not lazy, check if lodash one is. If so, replace everywhere
  let edgeTypes = edges?.map((x) => graph.edge(x.v, x.w)?.type);
  let res = lodash.some(edgeTypes, (x) => x === "event");
  return res;
}

function traverse(graph, id, visited = new Set()) {
  function inner(id) {
    visited.add(id);

    let reachable = graph
      .outEdges(id)
      .map((x) => {
        return { sink: x.w, edgeType: graph.edge(x.v, x.w)?.type };
      })
      ?.filter((x) => x.edgeType !== "event")
      .filter(
        //from Paper
        //"Note that updating the answer does not trigger $scope.check answer(), since this function needs explicit triggering via Check,"
        //is problematic, what if function is called from somewhere? that's why we need call relation

        (x) =>
          (graph.node(x.sink).opts?.type === "method" &&
            x.edgeType === "calls") ||
          !nodeTriggerableByEvent(graph, x.sink)
      )
      .map((x) => x.sink);

    // console.log(`traverse(${id}) -> ${reachable}`);
    reachable?.forEach((x) => {
      if (!visited.has(x)) {
        inner(x);
      }
    });
  }

  inner(id);
  return [...visited];
}

function l(graph, node) {
  let preorder = traverse(graph, node);
  let withInfo = preorder
    .map((x) => {
      return { id: x, ...graph.node(x) };
    })

    .filter((x) => x.opts?.type === "tag");
  return withInfo;
}

module.exports = { computeScenarios };
