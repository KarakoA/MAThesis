import { named, ThisInstance as This } from "../../common/models/identifier";
import { ESLinter } from "../eslinter";
import { property } from "../models/shared";
import { TopLevelVariables } from "../models/top-level-variables";

const code = `<template></template><script>
export default {
  name: "HelloWorld",
  data() {
    return {
      a: 0,
      b: 0,
      c: [],
      simple_object:{
        prop1:0,
        prop2: 5
      },
      object:{
        property1: 0,
        property2: {
          a: 0,
          b: 0
        }
      }
    };
  },
}</script>`;

const linter = new ESLinter();

let parsed: TopLevelVariables;
beforeAll(async () => {
  const result = await linter.lintCode(code);
  parsed = result.topLevel.topLevel;
});

describe("Parsing top level variables", () => {
  test("includes simple variables", () => {
    const expected = [
      property([This, named("a")]),
      property([This, named("b")]),
      property([This, named("c")]),
    ];
    expect(parsed).toEqual(expect.arrayContaining(expected));
  });
  test("includes simple objects", () => {
    const expected = [
      property([This, named("simple_object"), named("prop1")]),
      property([This, named("simple_object"), named("prop2")]),
    ];
    expect(parsed).toEqual(expect.arrayContaining(expected));
  });
  test("includes nested objects", () => {
    const expected = [
      property([This, named("object"), named("property1")]),
      property([This, named("object"), named("property2"), named("a")]),
      property([This, named("object"), named("property2"), named("b")]),
    ];
    expect(parsed).toEqual(expect.arrayContaining(expected));
  });
});
