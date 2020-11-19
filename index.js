const { ESLint } = require("eslint");

async function runLinter(files) {
  const eslint = new ESLint({
    rulePaths: ["visitors"],
  });
  //runs all rules
  const lintResults = await eslint.lintFiles(files);
  //employing a bit of a hack,
  //output of each rule is stored as stringified json in it's message
  return lintResults.map((result) => {
    let data = result.messages
      .map((x) => JSON.parse(x.message))
      //merge all together in one json
      .reduce((a, c) => {
        return { ...a, ...c };
      });
    return { name: result.filePath, ...data };
  });
}

function transform(rulesResults) {
  return rulesResults.map((result) => {
    let boundVarsAndMethods = result.bindings
      .map((r) => [r.target, r.source])
      .flat();
    //scope variables
    let boundVariables = result.variableNames.filter((x) =>
      boundVarsAndMethods.includes(x)
    );
    //scope methods
    let boundMethods = result.methodNames.filter((x) =>
      boundVarsAndMethods.includes(x)
    );
    return { ...result, boundVariables, boundMethods };
  });
}

async function main() {
  let r = await runLinter(["test.vue"]);

  console.log(transform(r));
}

main().catch((error) => {
  console.error(error);
});
