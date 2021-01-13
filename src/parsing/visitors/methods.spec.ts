import {
  generic,
  named,
  numeric,
  ThisInstance as This,
} from "../../common/models/identifier";
import { ESLinter } from "../eslinter";
import { MethodDefintion, MethodDefintitions } from "../models/methods";
import { method, property } from "../models/shared";

const linter = new ESLinter();
describe("Methods", () => {
  describe("computed", () => {
    const code = `<template></template><script>
        export default {
            name: "HelloWorld",
            created: function() {
                this.method1()
            },
            methods: {
                method1(){},
                method2(){}
            },
            computed: {
                c1:function(){
                    this.method1()
                    this.c = 2
                    let c = this.a
                    return c
                },
                c2:function(){
                    return 42
                }
            },    
        }</script>`;
    async function parse(code: string): Promise<MethodDefintitions> {
      const result = await linter.lintCode(code);
      return result.methods.computed;
    }

    test("includes all and only computed properties", async () => {
      const result = await parse(code);
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([
        { id: [This, named("c1")] },
        { id: [This, named("c2")] },
      ]);
    });
  });

  describe("init", () => {
    function template(created: string): string {
      return `<template></template>
      <script>
        export default {
            name: "HelloWorld",
             methods: {
                method1(){},
                method2(){}
            },
            computed: {
                c1:function(){
                    this.method1()
                    this.c = 2
                    let c = this.a
                    return c
                },
                c2:function(){
                    return 42
                }
            },    
            ${created}
        }
        </script>`;
    }

    async function parse(code: string): Promise<MethodDefintion | undefined> {
      const result = await linter.lintCode(code);
      return result.methods.init;
    }

    describe("with a created function", () => {
      const code = template(`created: function(){},`);
      test("includes it", async () => {
        const result = await parse(code);
        expect(result).toMatchObject({ id: [This, named("created")] });
      });
    });
    describe("with no created function", () => {
      const code = template("");
      test("is undefined", async () => {
        const result = await parse(code);
        expect(result).toBeUndefined();
      });
    });
  });
  describe("methods", () => {
    function template(methods: string): string {
      return `<template></template>
      <script>
        export default {
            name: "HelloWorld",
            methods:{${methods}}
        }
        </script>`;
    }
    async function parse(methods: string): Promise<MethodDefintitions> {
      const result = await linter.lintCode(template(methods));
      return result.methods.methods;
    }

    test("creates an entry per method in definition", async () => {
      const methods = "a(){},b(){}";
      const actual = await parse(methods);
      expect(actual).toHaveLength(2);
    });

    test("correctly parse simple arguments", async () => {
      const methods = "a(var1,var2,var3){}";
      const actual = await parse(methods);
      expect(actual).toStrictEqual([
        {
          id: [This, named("a")],
          args: [
            property(named("var1")),
            property(named("var2")),
            property(named("var3")),
          ],
          reads: [],
          writes: [],
          calls: [],
        },
      ]);
    });
    describe("with an empty body", () => {
      test("have only a name", async () => {
        const methods = "a(){}";
        const actual = await parse(methods);
        expect(actual).toStrictEqual([
          {
            id: [This, named("a")],
            args: [],
            reads: [],
            writes: [],
            calls: [],
          },
        ]);
      });
    });

    describe("with non-empty body", () => {
      describe("'reads' succeds when reading", () => {
        test("a single variable", async () => {
          const methods = `a(){let q = a}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [property(named("a"))],
              writes: [],
              calls: [],
            },
          ]);
        });

        test("multiple variables", async () => {
          const methods = `a(){
            const q = this.a
            this.b
        }`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [property(This, named("a")), property(This, named("b"))],
              writes: [],
              calls: [],
            },
          ]);
        });

        test("index variables", async () => {
          const methods = `a(){let q = a[i][1]}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [property(named("a"), generic("i"), numeric("1"))],
              writes: [],
              calls: [],
            },
          ]);
        });

        test("multiple variables as an expression on the same line", async () => {
          const methods = `a(){const q = this.a + this.b}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [property(This, named("a")), property(This, named("b"))],
              writes: [],
              calls: [],
            },
          ]);
        });

        test("multiple nested variables as an expression on the same line", async () => {
          const methods = `a(){const q = this.a.b.c + this.d.e.f}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [
                property(This, named("a"), named("b"), named("c")),
                property(This, named("d"), named("e"), named("f")),
              ],
              writes: [],
              calls: [],
            },
          ]);
        });

        test("complex expressions", async () => {
          const methods = `a(){const q = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [property(This, named("a")), property(This, named("b"))],
              writes: [],
              calls: expect.anything(),
            },
          ]);
        });
        describe("not contain", () => {
          test("variables written to", async () => {
            const methods = `a(){this.a = 3}`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                reads: [],
                writes: expect.anything(),
                calls: [],
              },
            ]);
          });
          test("called methods", async () => {
            const methods = `a(){const q = this.some_method(this.b)}`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                reads: [property(This, named("b"))],
                writes: expect.anything(),
                calls: expect.anything(),
              },
            ]);
          });
          test("arguments", async () => {
            const methods = `a(q){const q = this.some_method(this.b)}`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: expect.anything(),
                reads: [property(This, named("b"))],
                writes: expect.anything(),
                calls: expect.anything(),
              },
            ]);
          });
        });
      });

      describe("'writes' succeds when writing", () => {
        test("a single variable", async () => {
          const methods = `a(){a = 3}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [property(named("a"))],
              calls: [],
            },
          ]);
        });

        test("multiple variables", async () => {
          const methods = `a(){
                       this.a = 23
            this.b = 2
        }`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [property(This, named("a")), property(This, named("b"))],
              calls: [],
            },
          ]);
        });

        test("index variables", async () => {
          const methods = `a(){a[i][1] = 7}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [property(named("a"), generic("i"), numeric("1"))],
              calls: [],
            },
          ]);
        });

        test("multiple variables as an expression on the same line", async () => {
          const methods = `a(){this.a=3, this.b = 4}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [property(This, named("a")), property(This, named("b"))],
              calls: [],
            },
          ]);
        });

        test("multiple nested variables as an expression on the same line", async () => {
          const methods = `a(){this.a.b.c=3,this.d.e.f = 4}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [
                property(This, named("a"), named("b"), named("c")),
                property(This, named("d"), named("e"), named("f")),
              ],
              calls: [],
            },
          ]);
        });

        test("complex expressions", async () => {
          const methods = `a(){this.d = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
          const actual = await parse(methods);
          expect(actual).toMatchObject([
            {
              writes: [property(This, named("d"))],
            },
          ]);
        });
        describe("not contain", () => {
          test("variables read from", async () => {
            const methods = `a(){this.a }`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                reads: expect.anything(),
                writes: [],
                calls: [],
              },
            ]);
          });
          test("called methods", async () => {
            const methods = `a(){
                const q;
                q = this.some_method(this.b)
            }`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                writes: [property(named("q"))],
                reads: expect.anything(),
                calls: expect.anything(),
              },
            ]);
          });
          test("arguments", async () => {
            const methods = `a(q){const q = this.some_method(this.b)}`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: expect.anything(),
                reads: expect.anything(),
                writes: [],
                calls: expect.anything(),
              },
            ]);
          });
        });
      });
      describe("'calls' succeds when calling", () => {
        test("a single method", async () => {
          const methods = `a(){this.a()}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [],
              calls: [method([This, named("a")])],
            },
          ]);
        });

        test("multiple methods", async () => {
          const methods = `a(){
            this.a()
            this.b()
           }`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [],
              calls: [method([This, named("a")]), method([This, named("b")])],
            },
          ]);
        });

        test("method calls on index variables", async () => {
          const methods = `a(){let q = a[i][1].some_method()}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: [],
              writes: [],
              calls: [
                method([
                  named("a"),
                  generic("i"),
                  numeric("1"),
                  named("some_method"),
                ]),
              ],
            },
          ]);
        });

        test("multiple methods in an expression", async () => {
          const methods = `a(){const q= this.a(this.c) + this.b()}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: expect.anything(),
              writes: [],
              calls: [
                method([This, named("a")], [property(This, named("c"))]),
                method([This, named("b")]),
              ],
            },
          ]);
        });

        test("multiple nested methods in an expression on the same line", async () => {
          const methods = `a(){const q= this.a.b.c(this.h) + this.d.e.f()}`;
          const actual = await parse(methods);
          expect(actual).toStrictEqual([
            {
              id: [This, named("a")],
              args: [],
              reads: expect.anything(),
              writes: [],
              calls: [
                method(
                  [This, named("a"), named("b"), named("c")],
                  [property(This, named("h"))]
                ),
                method([This, named("d"), named("e"), named("f")]),
              ],
            },
          ]);
        });

        test("complex expressions", async () => {
          const methods = `a(){this.d = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
          const actual = await parse(methods);
          expect(actual).toMatchObject([
            {
              calls: [
                method(
                  [named("math"), named("doSomething")],
                  [property(This, named("b"))]
                ),
                method(
                  [This, named("some_method")],
                  [property(This, named("b"))]
                ),
              ],
            },
          ]);
        });
        test("multiple arguments", async () => {
          const methods = `a(){this.some_method(this.b,c,d)}`;
          const actual = await parse(methods);
          expect(actual).toMatchObject([
            {
              calls: [
                method(
                  [This, named("some_method")],
                  [
                    property(This, named("b")),
                    property(named("c")),
                    property(named("d")),
                  ]
                ),
              ],
            },
          ]);
        });

        //TODO not handled, yet, currently would have more args than actual called with
        test("binary expressions as arguments", async () => {
          const methods = `a(){this.some_method(a + b}`;
          const actual = await parse(methods);
          expect(actual).toMatchObject([
            {
              calls: [
                method(
                  [This, named("some_method")],
                  [[property(named("a")), property(named("b"))]]
                  //        [property(named("a")), property(named("b"))]
                ),
              ],
            },
          ]);
        });

        test("nested functions as arguments", async () => {
          const methods = `a(){this.some_method(this.other_method(math.random(),f),c,d)}`;
          const actual = await parse(methods);
          expect(actual).toMatchObject([
            {
              calls: [
                //some_method
                method(
                  [This, named("some_method")],
                  //some_method args
                  [
                    method(
                      [This, named("other_method")],
                      ////other_method args
                      [
                        method([named("math"), named("random")]),
                        property(named("f")),
                      ]
                    ),
                    property(named("c")),
                    property(named("d")),
                  ]
                ),
                //other_method
                method(
                  [This, named("other_method")],
                  ////other_method args
                  [
                    method([named("math"), named("random")]),
                    property(named("f")),
                  ]
                ),
                //math.random
                method([named("math"), named("random")]),
              ],
            },
          ]);
        });
        describe("not contain", () => {
          test("variables read from", async () => {
            const methods = `a(){this.a }`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                reads: expect.anything(),
                writes: [],
                calls: [],
              },
            ]);
          });
          test("variables written to", async () => {
            const methods = `a(){this.q = 3}`;
            const actual = await parse(methods);
            expect(actual).toStrictEqual([
              {
                id: [This, named("a")],
                args: [],
                reads: expect.anything(),
                writes: expect.anything(),
                calls: [],
              },
            ]);
          });
          test("arguments", async () => {
            const methods = `a(q){const q = this.some_method(this.b)}`;
            const actual = await parse(methods);
            expect(actual).toMatchObject([
              {
                calls: [
                  method(
                    [This, named("some_method")],
                    [property(This, named("b"))]
                  ),
                ],
              },
            ]);
          });
        });
      });
    });
  });
});
