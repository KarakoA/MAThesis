const { ESLint } = require("eslint");
const fs = require("fs");

const tempPath = "eslintrc-generated.js";

let conf = require("./.eslintrc");
//conf.rules = { "function-reads-writes": 1 };
console.log(conf);

fs.writeFileSync(tempPath, "module.exports = " + JSON.stringify(conf));
async function main() {
  const eslint = new ESLint({
    rulePaths: ["visitors"],
    overrideConfigFile: tempPath,
    useEslintrc: false,
    resolvePluginsRelativeTo: "./", // not working correctly
  });

  const results = await eslint.lintFiles(["test.vue"]);

  console.log(results.map(x => x.messages))
  //console.log(JSON.parse(results[0].messages[0].message))

}

main().catch((error) => {
  console.error(error);
});