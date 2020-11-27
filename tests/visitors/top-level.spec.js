const { runLinter } = require("../util/eslint-runner");
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

test("adds 1 + 2 to equal 3", async () => {
  let r = await runLinter(code, "top-level");
  console.log(r);
});
