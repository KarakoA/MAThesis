const { ESLinter } = require("../../eslinter");
const { NAME } = require("../../visitors/top-level");
let code = `<template></template><script>
export default {
    name: "HelloWorld",
    props: {
      msg: String,
    },
    data() {
      return {
        a: 0,
        b: 0,
        c: 0
      };
    },
    created: function() {
      this.method1()

    },
    methods: {
      method1(){},
      method2(){}
    }
}</script>`;

let linter = new ESLinter();

let parsed = undefined;
beforeAll(async () => (parsed = await linter.lintCode(code, NAME)));
describe("Parsing top level", () => {
  test("methods", () => {
    expect(parsed.methodNames).toEqual(["method1", "method2"]);
  });
  test("simple variables", () => {
    expect(parsed.variableNames).toEqual(["a", "b", "c"]);
  });
  test("functions called in init", () => {
    expect(parsed.calledInInit).toEqual(["method1"]);
  });

  //TODO complex variables not yet supported //topLevel:{otherLevel:0}
});
