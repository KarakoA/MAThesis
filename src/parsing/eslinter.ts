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
      overrideConfigFile: "./resources/eslintrc-generation.cjs",
    });
  }

  async lintCode(code: string): Promise<Result> {
    const lintResults = await this.eslint.lintText(code);
    //single 'file'
    const data = this.deserialize(
      lintResults[0].messages,
      lintResults[0].filePath
    );
    return data;
  }

  async lintFiles(
    paths: string[],
    outputOnlyFileName = true
  ): Promise<Result[]> {
    const lintResults = await this.eslint.lintFiles(paths);
    return lintResults.map((result) => {
      const path = this.fileNameOrPath(result.filePath, outputOnlyFileName);
      return this.deserialize(result.messages, path);
    });
  }

  private deserialize(
    messages: Linter.LintMessage[],
    filePath: string
  ): Result {
    //employing a bit of a hack,
    //output of each rule is stored as stringified json in it's message
    const methodsJSON = messages.find((x) => x.ruleId === METHODS_NAME)
      ?.message;
    const topLevelJSON = messages.find((x) => x.ruleId === TOP_LEVEL_NAME)
      ?.message;
    const bindingsJSON = messages.find((x) => x.ruleId === BINDINGS_NAME)
      ?.message;

    const methods: MethodsResult = methodsJSON ? JSON.parse(methodsJSON) : [];
    const topLevel: TopLevelVariablesResult = topLevelJSON
      ? JSON.parse(topLevelJSON)
      : [];
    const bindings: BindingsResult = bindingsJSON
      ? deserializeResult(bindingsJSON)
      : { bindings: new Map() };
    return new Result(topLevel, methods, bindings, filePath);
  }

  private fileNameOrPath(
    basePath: string,
    outputOnlyFileName: boolean
  ): string {
    return outputOnlyFileName ? path.basename(basePath) : basePath;
  }
}
