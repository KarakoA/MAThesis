const { ESLinter } = require("./eslinter");
const fs = require("fs");
const { compute } = require("./generator/transformer.js");
const { computeScenarios } = require("./scenarios/scenarios.js");
const process = require("process");
async function main() {
  let args = process.argv.slice(2);
  let file = args[0] ?? "./src/test-files/test-add-sub.vue";
  let outPath = args[1] ?? "./src/data.json";
  let r = await new ESLinter().lintFiles([file]);

  r = compute(r[0]);
  computeScenarios(r);

  fs.writeFileSync(outPath, JSON.stringify(r, null, 2));
}

main().catch((error) => {
  console.error(error);
});
