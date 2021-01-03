import { ESLinter } from "../../eslinter.js";
import { NAME } from "../../visitors/function-reads-writes";
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
    },
    created: function (){
        this.method1()
        this.c = 2
        let a = this.a
    }
}</script>`;

let linter = new ESLinter();

let parsed = undefined;
beforeAll(async () => (parsed = await linter.lintCode(code, NAME)));
describe("Init correctly parsed", () => {
  test("contains a single method named init", () => {
    expect(parsed.init.name).toEqual("init");
  });
  test("reads", () => {
    expect(parsed.init.reads).toEqual(["a"]);
  });
  test("writes", () => {
    expect(parsed.init.writes).toEqual(["c"]);
  });
  test("calls", () => {
    expect(parsed.init.calls).toEqual(["method1"]);
  });
});
