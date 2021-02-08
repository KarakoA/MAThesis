import { ExtendedGraph, serialize, deserialize } from "./graph";
import { tag, data, edge } from "./models/graph";
describe("ExtendedGraph", () => {
  describe("serialisation", () => {
    test("serialize followed by deserialize results in the same object", () => {
      const graph = new ExtendedGraph();
      graph.addEdge(edge(data("A"), tag("B")));
      const actual = deserialize(serialize(graph));
      expect(JSON.stringify(actual)).toStrictEqual(JSON.stringify(graph));
    });
  });

  describe("'connect'", () => {
    describe("does nothing when", () => {
      test("no nodes are provided", () => {
        const graph = new ExtendedGraph();
        graph.connect([]);
        expect(graph.nodes()).toHaveLength(0);
      });
      test("a single node is provided", () => {
        const graph = new ExtendedGraph();
        graph.connect([tag("A")]);
        expect(graph.nodes()).toHaveLength(0);
      });
    });

    describe("connects", () => {
      test("two nodes successfully", () => {
        const graph = new ExtendedGraph();
        graph.connect([tag("A"), tag("B")]);
        expect(graph.edge("A", "B")).toBeDefined();
        expect(graph.edge("B", "A")).toBeUndefined();
      });
      test("n nodes successfully", () => {
        const graph = new ExtendedGraph();
        graph.connect([tag("A"), tag("B"), tag("C")]);
        const actual = graph.edges();
        const expected = expect.arrayContaining([
          edge(tag("A"), tag("B")),
          edge(tag("B"), tag("C")),
        ]);
        expect(actual).toStrictEqual(expected);
      });
    });
  });
});
