const { ESLinter } = require("./eslinter");
const fs = require("fs");
const { compute } = require("./generator/transformer.js");

async function main() {
  let r = await new ESLinter().lintFiles(["./src/test-files/test-lists.vue"]);

  //  console.log(r[0].topLevelData);
  r = compute(r[0]);

  fs.writeFileSync("./src/data.json", JSON.stringify(r, null, 2));
}

main().catch((error) => {
  console.error(error);
});
