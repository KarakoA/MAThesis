import { ESLint, Linter } from "eslint";
import path from "path";
import { Result } from "./models/result";
import { NAME as BINDINGS_NAME } from "./visitors/template-bindings";
import { NAME as TOP_LEVEL_NAME } from "./visitors/top-level-variables";
import { NAME as METHODS_NAME } from "./visitors/methods";
import { TopLevelVariablesResult } from "./models/top-level-variables";
import { BindingsResult, deserializeResult } from "./models/template-bindings";
import { MethodsResult } from "./models/methods";
export class ESLinter {
  eslint: ESLint;
  constructor() {
    this.eslint = new ESLint({
      rulePaths: ["./src/parsing/visitors"],
      useEslintrc: false,
      overrideConfigFile: "./src/eslintrc-generation.cjs",
    });
  }

  async lintCode(code: string, ruleName: string): Promise<Result> {
    //TODO implement
    //runs all rules and selects only the ones we are interested in
    const lintResults = await this.eslint.lintText(code);
    //single 'file'
    const data = lintResults[0].messages
      .filter((x) => x.ruleId === ruleName)
      .map((x) => JSON.parse(x.message))[0];
    //TODO any type
    return data;
  }

  async lintFiles(
    paths: string[],
    outputOnlyFileName = true
  ): Promise<Result[]> {
    const lintResults = await this.eslint.lintFiles(paths);
    //employing a bit of a hack,
    //output of each rule is stored as stringified json in it's message
    return lintResults.map((result) => {
      result.filePath;
      const path = this.fileNameOrPath(result.filePath, outputOnlyFileName);
      return this.deserialize(result.messages, path);
    });
  }

  private deserialize(
    messages: Linter.LintMessage[],
    filePath: string
  ): Result {
    const methodsJSON = messages.find((x) => x.ruleId === METHODS_NAME)
      ?.message;
    const topLevelJSON = messages.find((x) => x.ruleId === TOP_LEVEL_NAME)
      ?.message;
    const bindingsJSON = messages.find((x) => x.ruleId === BINDINGS_NAME)
      ?.message;

    if (methodsJSON && topLevelJSON && bindingsJSON) {
      const methods: MethodsResult = JSON.parse(methodsJSON);
      const topLevel: TopLevelVariablesResult = JSON.parse(topLevelJSON);
      const bindings: BindingsResult = deserializeResult(bindingsJSON);
      return new Result(topLevel, methods, bindings, filePath);
    }
    throw new Error("Methods, bindings or top level undefined!");
  }

  private fileNameOrPath(
    basePath: string,
    outputOnlyFileName: boolean
  ): string {
    return outputOnlyFileName ? path.basename(basePath) : basePath;
  }
}
