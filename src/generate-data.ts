import { ESLinter } from "./parsing/eslinter";
import fs from "fs";
import { computeAndPrintScenarios } from "./scenarios/scenarios";
import process from "process";
import { Transformer } from "./generator/transformer";

import * as util from "util";
util.inspect.defaultOptions.depth = 13;

async function main() {
  const args = process.argv.slice(2);
  const file = args[0] ?? "./src/test-files/test-add-sub.vue";
  const outPath = args[1] ?? "./src/data.json";
  const results = await new ESLinter().lintFiles([file]);

  const transformer = new Transformer(results[0]);

  const graphJson = transformer.compute();

  computeAndPrintScenarios(graphJson);

  fs.writeFileSync(outPath, JSON.stringify(graphJson, null, 2));
}

main().catch((error) => {
  console.error(error);
});
