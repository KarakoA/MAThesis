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
        c: 0,
        answer: undefined,
        right: undefined,
        count_right: 0,
        count_wrong: 0,
        topLevel:{otherLevel:0}
      };
    }
}</script>`;

let linter = new ESLinter()
test("adds 1 + 2 to equal 3", async () => {
  let r = await linter.lintCode(code, NAME);
  console.log(r);
});
