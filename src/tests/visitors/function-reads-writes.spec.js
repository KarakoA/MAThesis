const { ESLinter } = require("../../eslinter");
const { NAME } = require("../../visitors/function-reads-writes");
function template(methods) {
  return `
  <template>
  </template>
<script>
export default {
    name: "HelloWorld",
    methods:{
${methods}        
    }
}</script>`;
}

let linter = new ESLinter();
async function parse(methods) {
  return await linter.lintCode(template(methods), NAME);
}

describe("Method", () => {
  test("creates an entry per method in definition", async () => {
    let methods = "a(){},b(){}";
    let actual = await parse(methods);
    expect(actual.methods).toStrictEqual([
      {
        name: "a",
        reads: expect.anything(),
        writes: expect.anything(),
        calls: expect.anything(),
      },
      {
        name: "b",
        reads: expect.anything(),
        writes: expect.anything(),
        calls: expect.anything(),
      },
    ]);
  });

  describe("if empty body", () => {
    test("has only a name", async () => {
      let methods = "a(){}";
      let actual = await parse(methods);
      expect(actual.methods).toStrictEqual([
        { name: "a", reads: [], writes: [], calls: [] },
      ]);
    });
  });

  describe("if non empty body", () => {
    describe("'reads' succeds when reading", () => {
      test("a single variable", async () => {
        let methods = `a(){let q = this.a}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: ["a"], writes: [], calls: [] },
        ]);
      });
      test("multiple variables", async () => {
        let methods = `a(){
            let q = this.a
            this.b
        }`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: ["a", "b"], writes: [], calls: [] },
        ]);
      });
      test("multiple variables as an expression on the same line", async () => {
        let methods = `a(){let q = this.a + this.b}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: ["a", "b"], writes: [], calls: [] },
        ]);
      });
      test("complex expressions", async () => {
        let methods = `a(){let q = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: ["a", "b"],
            writes: [],
            calls: expect.anything(),
          },
        ]);
      });
      test("not contain simple variables", async () => {
        let methods = `a(){this.a = b}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: [],
            writes: expect.anything(),
            calls: expect.anything(),
          },
        ]);
      });
      test("not contain variables written to", async () => {
        let methods = `a(){this.a = 3}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: expect.anything(), calls: [] },
        ]);
      });
      test("not contain methods called", async () => {
        let methods = `a(){let q = this.some_method(this.b)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: ["b"],
            writes: expect.anything(),
            calls: ["some_method"],
          },
        ]);
      });
    });
    describe("'writes' succeds when writing", () => {
      test("a single variable", async () => {
        let methods = `a(){this.a = 3}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: ["a"], calls: [] },
        ]);
      });
      test("multiple variables", async () => {
        let methods = `a(){
            this.a = 23
            this.b = 2
        }`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: ["a", "b"], calls: [] },
        ]);
      });
      test("multiple variables as an expression on the same line", async () => {
        let methods = `a(){this.a=3,this.b = 4}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: ["a", "b"], calls: [] },
        ]);
      });
      test("complex expressions", async () => {
        let methods = `a(){this.d = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: ["d"],
            calls: expect.anything(),
          },
        ]);
      });

      test("not contain simple variables", async () => {
        let methods = `a(){let q = this.a}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: expect.anything(), writes: [], calls: [] },
        ]);
      });
      test("not contain variables read from", async () => {
        let methods = `a(){this.a}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: expect.anything(), writes: [], calls: [] },
        ]);
      });

      test("not contain methods called", async () => {
        let methods = `a(){let q = this.some_method(this.b)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: [],
            calls: expect.anything(),
          },
        ]);
      });
    });
    describe("'calls' succeds when calling", () => {
      test("a single method", async () => {
        let methods = `a(){this.a()}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: [], calls: ["a"] },
        ]);
      });
      test("multiple methods", async () => {
        let methods = `a(){
            this.a()
            this.b()
        }`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          { name: "a", reads: [], writes: [], calls: ["a", "b"] },
        ]);
      });
      test("multiple methods in an expression", async () => {
        let methods = `a(){let q= this.a(this.c) + this.b()}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: [],
            calls: ["a", "b"],
          },
        ]);
      });
      test("complex expressions", async () => {
        let methods = `a(){this.d = this.a + math.doSomething(this.b) + 3 + 22 * this.a + this.some_method(this.b)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: expect.anything(),
            calls: ["some_method"],
          },
        ]);
      });

      test("not contain methods from packages", async () => {
        let methods = `a(){this.a = math.sqrt(2)}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: expect.anything(),
            calls: [],
          },
        ]);
      });
      test("not contain variables read from", async () => {
        let methods = `a(){this.a}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: expect.anything(),
            calls: [],
          },
        ]);
      });

      test("not contain variables written to", async () => {
        let methods = `a(){this.q = 3}`;
        let actual = await parse(methods);
        expect(actual.methods).toStrictEqual([
          {
            name: "a",
            reads: expect.anything(),
            writes: expect.anything(),
            calls: [],
          },
        ]);
      });
    });
  });
});
