const { ESLint } = require("eslint");

async function runLinter(code, rule) {
  const eslint = new ESLint({
    rulePaths: ["visitors"],
  });
  //runs all rules and selects only the ones we are interested in
  const lintResults = await eslint.lintText(code);
  let data = lintResults[0].messages
    .filter((x) => x.ruleId === rule)
    .map((x) => JSON.parse(x.message))[0]
  return data;
}

module.exports = { runLinter };
