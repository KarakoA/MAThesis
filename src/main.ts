import { ESLinter } from "./parsing/eslinter";
import fs from "fs";
import { computeAndPrintScenarios } from "./scenarios/scenarios";
import process from "process";
import { Transformer } from "./generator/transformer";

import * as util from "util";
import { serialize } from "./generator/graph";
util.inspect.defaultOptions.depth = 13;

async function main() {
  const args = process.argv.slice(2);
  const file = args[0] ?? "./resources/test-files/test-add-sub-v3.vue";
  const outPath = args[1] ?? "./web/data.json";
  const depth = Number(args[2] ?? 4);
  const results = await new ESLinter().lintFiles([file]);
  //console.log(results);
  const transformer = new Transformer(results[0]);

  const graph = transformer.compute();

  computeAndPrintScenarios(graph, depth);

  const graphJSON = serialize(graph);
  fs.writeFileSync(outPath, JSON.stringify(graphJSON, null, 2));
}

main().catch((error) => {
  console.error(error);
});
