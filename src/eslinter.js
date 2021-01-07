import { ESLint } from "eslint";
import path from "path";

export class ESLinter {
  constructor() {
    this.eslint = new ESLint({
      rulePaths: ["./src/parsing/visitors"],
      useEslintrc: false,
      overrideConfigFile: "./src/eslintrc-generation.cjs",
    });
  }

  async lintCode(code, rule) {
    //runs all rules and selects only the ones we are interested in
    const lintResults = await this.eslint.lintText(code);
    //single 'file'
    let data = lintResults[0].messages
      .filter((x) => x.ruleId === rule)
      .map((x) => JSON.parse(x.message))[0];
    return data;
  }

  async lintFiles(paths, outputOnlyFileName = true) {
    const lintResults = await this.eslint.lintFiles(paths);
    //employing a bit of a hack,
    //output of each rule is stored as stringified json in it's message
    return lintResults.map((result) => {
      console.log(result);
      this.transformToJSON(result, outputOnlyFileName);
    });
  }

  transformToJSON(lintResult, outputOnlyFileName) {
    let data = lintResult.messages
      .map((x) => JSON.parse(x.message))
      //merge all together in one json
      .reduce((a, c) => {
        return { ...a, ...c };
      });
    let name = outputOnlyFileName
      ? path.basename(lintResult.filePath)
      : lintResult.filePath;
    return { name: name, ...data };
  }
}
