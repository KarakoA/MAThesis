import {
  IdentifierType,
  ThisInstance as This,
  named,
  generic,
  numeric,
} from "../common/models/identifier";
import { Transformer } from "./transformer";
import * as p from "../parsing/models/shared";
import { Entity } from "../parsing/models/shared";
import {
  MethodDefinitions,
  MethodDefinition,
  methodDef,
} from "../parsing/models/methods";
import { Result } from "../parsing/models/result";
import { method, init, EdgeType, NodeType } from "./models/graph";
import { Binding, BindingType, Tag } from "../parsing/models/template-bindings";
import { TopLevelProperties } from "../parsing/models/top-level-properties";
import { Identifiers } from "../common/models/identifiers";

describe("Transformer when computing", () => {
  const defaultInit = methodDef([This, named("created")]);
  const defaultTag = {
    id: "<name>",
    name: "<name>",
    loc: {
      start: { line: -1, column: -1 },
      end: { line: -1, column: -1 },
    },
  } as Tag;
  const id = {
    this: This,
    m: named("m"),
    m1: named("m1"),

    A: named("A"),
    B: named("B"),
    C: named("C"),
    D: named("D"),
    E: named("E"),
    F: named("F"),

    i: generic("i"),
    j: generic("j"),

    index1: numeric("1"),
  };
  function template(
    methods: MethodDefinitions,
    init: MethodDefinition | undefined = undefined,
    bindings: Binding[] = [],
    computed: MethodDefinitions = [],
    topLevel: TopLevelProperties = []
  ): Result {
    return {
      topLevel: { topLevel },
      methods: {
        methods,
        init,
        computed,
      },
      bindings: { bindings },
      fileName: "<path>",
    };
  }

  function templateWithBindingAccess(
    methods: MethodDefinitions,
    computed: MethodDefinitions = [],
    accesses: Entity,
    bindingType: BindingType = BindingType.ONE_WAY,
    topLevel: TopLevelProperties = []
  ): Result {
    return template(
      methods,
      defaultInit,
      [
        {
          tag: defaultTag,
          values: [{ item: accesses, bindingType }],
        },
      ],
      computed,
      topLevel
    );
  }

  describe("init", () => {
    test("correctly parses the node", () => {
      const data = template([], methodDef([This, named("created")]));
      const actual = new Transformer(data).compute();
      expect(actual.nodes()).toHaveLength(1);
      expect(actual.node("this.created")).toStrictEqual(
        init("this.created", "created")
      );
    });
  });
  describe("computed", () => {
    test("correctly parses the nodes", () => {
      const data = templateWithBindingAccess(
        [],
        [methodDef([This, named("computed_prop")])],
        p.property(named("computed_prop"))
      );

      const actual = new Transformer(data).compute();
      expect(actual.node("this.computed_prop")).toStrictEqual(
        method("this.computed_prop", "computed_prop")
      );
    });
  });

  describe("methods", () => {
    describe("reads", () => {
      const methodId = [This, id.m];
      function template(...ids: Identifiers): Result {
        return templateWithBindingAccess(
          [methodDef(methodId, [], /*reads*/ [p.property(...ids)])],
          [],
          p.method(methodId)
        );
      }
      test("excludes all non-this properties", () => {
        const data = template(id.B);
        const actual = new Transformer(data).compute();
        //only the tag binding to its
        expect(actual.outEdges("this.m()")).toHaveLength(1);
        expect(actual.inEdges("this.m()")).toHaveLength(0);
        expect(actual.edge("B", "this.m()")).toBeUndefined();
      });
      test("includes this properties", () => {
        const data = template(This, id.B);
        const actual = new Transformer(data).compute();
        expect(actual.edge("this.B", "this.m()")).toMatchObject({
          label: EdgeType.SIMPLE,
        });
      });
    });

    describe("writes", () => {
      const methodId = [This, id.m];
      function template(...ids: Identifiers): Result {
        return templateWithBindingAccess(
          [methodDef(methodId, [], [], /*writes*/ [p.property(...ids)])],
          [],
          p.method(methodId)
        );
      }
      test("excludes all non-this properties", () => {
        const data = template(id.B);
        const actual = new Transformer(data).compute();
        //only the tag binding to its
        expect(actual.outEdges("this.m()")).toHaveLength(1);
        expect(actual.inEdges("this.m()")).toHaveLength(0);
        expect(actual.edge("this.m()", "B")).toBeUndefined();
      });
      test("includes this properties", () => {
        const data = template(This, id.B);
        const actual = new Transformer(data).compute();
        expect(actual.edge("this.m()", "this.B")).toMatchObject({
          label: EdgeType.SIMPLE,
        });
      });
    });
    describe("called", () => {
      const methodId = [This, id.m];
      function template(
        ids: Identifiers,
        ...methodDefs: MethodDefinitions
      ): Result {
        return templateWithBindingAccess(
          [
            methodDef(methodId, [], [], [], /*calls*/ [p.method([...ids])]),
            ...methodDefs,
          ],
          [],
          p.method(methodId)
        );
      }
      test("excludes non-this methods", () => {
        const data = template([id.m1]);
        const actual = new Transformer(data).compute();
        //only the tag binding to its
        expect(actual.outEdges("this.m()")).toHaveLength(1);
        expect(actual.inEdges("this.m()")).toHaveLength(0);
        expect(actual.edge("this.m()", "this.m1()")).toBeUndefined();
      });

      test("includes simple methods and creates node and call edges for each", () => {
        const data = template([This, id.m1], methodDef([This, id.m1]));
        const actual = new Transformer(data).compute();
        // the tag binding to it and the edge
        expect(actual.outEdges("this.m()")).toHaveLength(2);
        expect(actual.inEdges("this.m()")).toHaveLength(0);
        expect(actual.edge("this.m()", "this.m1()")).toMatchObject({
          label: EdgeType.CALLS,
        });
      });
      test("direct recursive methods cause no problem", () => {
        const data = template([This, id.m]);
        const actual = new Transformer(data).compute();
        // the tag binding to it and the edge
        expect(actual.outEdges("this.m()")).toHaveLength(2);
        expect(actual.inEdges("this.m()")).toHaveLength(1);
        expect(actual.edge("this.m()", "this.m()")).toMatchObject({
          label: EdgeType.CALLS,
        });
      });
      test("indirect recursive methods cause no problem", () => {
        const data = template(
          [This, id.m1],
          methodDef([This, id.m1], [], [], [], [p.method([This, id.m])])
        );
        const actual = new Transformer(data).compute();
        //the tag binding to it and the edge
        expect(actual.outEdges("this.m()")).toHaveLength(2);
        expect(actual.inEdges("this.m()")).toHaveLength(1);

        expect(actual.edge("this.m()", "this.m1()")).toMatchObject({
          label: EdgeType.CALLS,
        });
        expect(actual.outEdges("this.m1()")).toHaveLength(1);
        expect(actual.inEdges("this.m1()")).toHaveLength(1);
        expect(actual.edge("this.m1()", "this.m()")).toMatchObject({
          label: EdgeType.CALLS,
        });
      });
      describe("with arguments", () => {
        const methodId = [This, id.m];
        const methodId1 = [This, id.m1];
        const data = templateWithBindingAccess(
          [
            methodDef(
              methodId,
              [p.property(id.A)],
              [],
              [],
              [
                p.method(methodId1, [
                  //simple property
                  p.property(id.B),
                  //this property
                  p.property(This, id.C),
                  //same as method 'm' arg
                  p.property(id.A),
                  //this method
                  p.method([This, id.m1]),
                  //other method
                  p.method([id.B, id.m1]),
                  //starts with method 'm' arg
                  p.property(id.A, id.F),
                ]),
              ]
            ),
            methodDef(methodId1, [
              p.property(id.A),
              p.property(id.B),
              p.property(id.C),
              p.property(id.D),
              p.property(id.E),
              p.property(id.F),
            ]),
          ],
          [],
          p.method(methodId, [p.property(id.E)])
          //called with params
        );
        describe("of type", () => {
          //not nice, but easiest way to test, need a lot of templating otherwise or ugly regex
          test("this properties are kept, methods(non-this and this) are mapped to 'method' and arguments are substituted correctly", () => {
            const actual = new Transformer(data).compute();
            expect(actual.outEdges("this.m(this.E)")).toMatchObject(
              expect.arrayContaining([
                expect.objectContaining({
                  sink: {
                    name: "m1(other,C,E,method,method,E.F)",
                    id: "this.m1(other,this.C,this.E,method,method,this.E.F)",
                    discriminator: NodeType.METHOD,
                  },
                  label: EdgeType.CALLS,
                }),
              ])
            );
          });
        });
      });
    });
  });
  describe("bindings of type", () => {
    function templateOnlyBindingType(bindingType: BindingType) {
      return templateWithBindingAccess(
        [],
        [],
        p.property(This, id.A),
        bindingType
      );
    }

    describe("event", () => {
      test("have an event edge from tag to binding", () => {
        const data = templateOnlyBindingType(BindingType.EVENT);
        const actual = new Transformer(data).compute();
        expect(actual.edge(defaultTag.id, "this.A")).toMatchObject({
          label: EdgeType.EVENT,
        });
        expect(actual.edge("this.A", defaultTag.id)).toBeUndefined();
      });

      describe("with method calls", () => {
        function templateWithMethods(calls: p.Entity) {
          return templateWithBindingAccess(
            [methodDef([This, id.m1])],
            [],
            calls,
            BindingType.EVENT,
            [p.property(This, named("problems"))]
          );
        }
        test("simple works correctly", () => {
          const data = templateWithMethods(p.method([This, id.m1]));
          const actual = new Transformer(data).compute();
          expect(actual.edge(defaultTag.id, "this.m1()")).toMatchObject({
            label: BindingType.EVENT,
          });
        });

        test("on defined top level properties work correctly", () => {
          const data = templateWithMethods(
            p.method([This, named("problems"), named("push")])
          );
          const actual = new Transformer(data).compute();
          expect(actual.edge(defaultTag.id, "this.problems")).toMatchObject({
            label: BindingType.EVENT,
          });
        });
        test("on lazy top level properties work correctly", () => {
          const data = templateWithMethods(
            p.method([This, named("problems"), named("latest"), named("push")])
          );
          const actual = new Transformer(data).compute();
          expect(
            actual.edge(defaultTag.id, "this.problems.latest")
          ).toMatchObject({
            label: BindingType.EVENT,
          });
        });
      });
    });

    describe("one way", () => {
      test("have a simple edge from binding to tag", () => {
        const data = templateOnlyBindingType(BindingType.ONE_WAY);
        const actual = new Transformer(data).compute();
        expect(actual.edge(defaultTag.id, "this.A")).toBeUndefined();
        expect(actual.edge("this.A", defaultTag.id)).toMatchObject({
          label: EdgeType.SIMPLE,
        });
      });
    });
    describe("two way", () => {
      test("have a simple edge from binding to tag and an event one from tag to binding", () => {
        const data = templateOnlyBindingType(BindingType.TWO_WAY);
        const actual = new Transformer(data).compute();
        expect(actual.edge(defaultTag.id, "this.A")).toMatchObject({
          label: EdgeType.EVENT,
        });
        expect(actual.edge("this.A", defaultTag.id)).toMatchObject({
          label: EdgeType.SIMPLE,
        });
      });
    });
  });

  describe("top level", () => {
    function templateTopLevel(topLevel: TopLevelProperties) {
      return template(
        [],
        methodDef([This, named("created")]),
        [],
        [],
        topLevel
      );
    }
    test("creates a node for each simple indentifier", () => {
      const data = templateTopLevel([p.property(This, named("a"))]);
      const actual = new Transformer(data).compute();
      expect(actual.nodes()).toMatchObject(
        expect.arrayContaining([
          {
            discriminator: NodeType.DATA,
            id: "this",
            name: "this",
            parent: undefined,
            type: IdentifierType.THIS,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a",
            name: "a",
            parent: "this",
            type: IdentifierType.NAME_IDENTIFIER,
          },
        ])
      );
    });
    test("creates a node for each generic indentifier", () => {
      const data = templateTopLevel([
        p.property(This, named("a"), generic("i")),
      ]);
      const actual = new Transformer(data).compute();
      expect(actual.nodes()).toMatchObject(
        expect.arrayContaining([
          {
            discriminator: NodeType.DATA,
            id: "this",
            name: "this",
            parent: undefined,
            type: IdentifierType.THIS,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a",
            name: "a",
            parent: "this",
            type: IdentifierType.NAME_IDENTIFIER,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a[i]",
            name: "a[i]",
            parent: "this.a",
            type: IdentifierType.GENERIC_INDEX,
          },
        ])
      );
    });

    test("creates a node for each index and generic indentifier in mixed identifiers", () => {
      const data = templateTopLevel([
        p.property(
          This,
          named("a"),
          generic("i"),
          generic("j"),
          numeric("1"),
          named("b"),
          numeric("1")
        ),
        p.property(This, named("a"), generic("i")),
      ]);
      const actual = new Transformer(data).compute();
      expect(actual.nodes()).toMatchObject(
        expect.arrayContaining([
          {
            discriminator: NodeType.DATA,
            id: "this",
            name: "this",
            parent: undefined,
            type: IdentifierType.THIS,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a",
            name: "a",
            parent: "this",
            type: IdentifierType.NAME_IDENTIFIER,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a[i]",
            name: "a[i]",
            parent: "this.a",
            type: IdentifierType.GENERIC_INDEX,
          },
          {
            discriminator: NodeType.DATA,
            id: "this.a[i][j]",
            name: "a[i][j]",
            parent: "this.a[i]",
            type: IdentifierType.GENERIC_INDEX,
          },
        ])
      );
    });
  });
});
