import { ESLinter } from "../../eslinter.js";
import { NAME } from "../../visitors/computed.js";
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
        
    }
}</script>`;

let linter = new ESLinter();

let parsed = undefined;
beforeAll(async () => (parsed = await linter.lintCode(code, NAME)));
describe("Computed correctly parsed", () => {
  test("contains two methods", () => {
    expect(parsed.computed).toHaveLength(2);
    expect(parsed.computed.map((x) => x.name)).toEqual(["c1", "c2"]);
  });
  test("reads", () => {
    expect(parsed.computed).toStrictEqual([
      {
        name: "c1",
        reads: ["a"],
        writes: expect.anything(),
        calls: expect.anything(),
      },
      {
        name: "c2",
        reads: [],
        writes: expect.anything(),
        calls: expect.anything(),
      },
    ]);
  });
  test("writes", () => {
    expect(parsed.computed).toStrictEqual([
      {
        name: "c1",
        reads: expect.anything(),
        writes: ["c"],
        calls: expect.anything(),
      },
      {
        name: "c2",
        reads: expect.anything(),
        writes: [],
        calls: expect.anything(),
      },
    ]);
  });
  test("calls", () => {
    expect(parsed.computed).toStrictEqual([
      {
        name: "c1",
        reads: expect.anything(),
        writes: expect.anything(),
        calls: ["method1"],
      },
      {
        name: "c2",
        reads: expect.anything(),
        writes: expect.anything(),
        calls: [],
      },
    ]);
  });
});
