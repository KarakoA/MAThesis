import { ESLinter } from "../../eslinter";
import { NAME } from "../../visitors/top-level";
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
        c: 0,
        d: {
          e:{
            f:0,
            g: {h:0}
          }
        }
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
  test("variables", () => {
    expect(parsed.variableNames).toEqual([
      "a",
      "b",
      "c",
      "d",
      "d.e",
      "d.e.f",
      "d.e.g",
      "d.e.g.h",
    ]);
  });
  test("functions called in init", () => {
    expect(parsed.calledInInit).toEqual(["method1"]);
  });
});
