const { ESLinter } = require("./eslinter");
const fs = require("fs");
const { compute } = require("./generator/transformer.js");

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
    //scope computed methods
    let boundComputedVariables = result.computed
      .map((x) => x.name)
      .filter((x) => boundVarsAndMethods.includes(x));
    return { ...result, boundVariables, boundMethods, boundComputedVariables };
  });
}

async function main() {
  let r = await new ESLinter().lintFiles(["./src/test-files/test-lists.vue"]);

  console.log(r);
  r = compute(r[0]);
  fs.writeFileSync("./src/data.json", JSON.stringify(r, null, 2));
}

main().catch((error) => {
  console.error(error);
});
