import { IdentifierType } from "../common/models/identifier";
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

  describe("'leaf nodes'", () => {
    test("returns the correct nodes", () => {
      const graph = new ExtendedGraph();
      graph.addNodes([
        data("A"),
        data("B", "A"),
        data("C", "B"),
        data("D", "B"),
        tag("F"),
        data("G"),
      ]);
      const actual = graph.leafNodes("B");
      const expected = expect.arrayContaining([data("C", "B"), data("D", "B")]);
      expect(actual).toStrictEqual(expected);
    });
  });

  describe("'matching generic node'", () => {
    describe("if there is no matching node", () => {
      test("returns undefined", () => {
        const graph = new ExtendedGraph();
        const numeric = data("B[0]", "B", IdentifierType.NUMERIC_INDEX);
        graph.addNodes([
          data("A"),
          data("A[i]", "A", IdentifierType.GENERIC_INDEX),
          data("B", "A"),
          numeric,
        ]);
        const actual = graph.getMatchingGenericNode(numeric);
        expect(actual).toBeUndefined();
      });
    });
    describe("if there is a matching node", () => {
      test("in a simple graph returns it", () => {
        const graph = new ExtendedGraph();
        const numeric = data("B[0]", "B", IdentifierType.NUMERIC_INDEX);
        const generic = data("B[i]", "B", IdentifierType.GENERIC_INDEX);
        graph.addNodes([
          data("A"),
          data("A[i]", "A", IdentifierType.GENERIC_INDEX),
          data("B", "A"),
          generic,
          numeric,
        ]);
        const actual = graph.getMatchingGenericNode(numeric);
        expect(actual).toMatchObject(generic);
      });

      test("in a graph with multiple indices returns it", () => {
        const graph = new ExtendedGraph();
        const numeric = data("A[i][0]", "A[i]", IdentifierType.NUMERIC_INDEX);
        const numeric2 = data("A[i][1]", "A[i]", IdentifierType.NUMERIC_INDEX);
        const generic = data("A[i][j]", "A[i]", IdentifierType.GENERIC_INDEX);
        graph.addNodes([
          data("A"),
          data("A[i]", "A", IdentifierType.GENERIC_INDEX),
          generic,
          numeric2,
          numeric,
        ]);
        const actual = graph.getMatchingGenericNode(numeric);
        expect(actual).toMatchObject(generic);
      });
    });
  });
});
