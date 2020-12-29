const { ESLinter } = require("./eslinter");
const fs = require("fs");
const { compute } = require("./generator/transformer.js");
const { computeScenarios } = require("./scenarios/scenarios.js");
async function main() {
  let r = await new ESLinter().lintFiles(["./src/test-files/test-add-sub.vue"]);

  //  console.log(r[0].topLevelData);
  r = compute(r[0]);
  computeScenarios(r);

  fs.writeFileSync("./src/data.json", JSON.stringify(r, null, 2));
}

main().catch((error) => {
  console.error(error);
});
