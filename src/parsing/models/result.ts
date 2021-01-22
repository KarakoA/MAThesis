import { MethodsResult } from "./methods";
import { BindingsResult } from "./template-bindings";
import { TopLevelVariablesResult } from "./top-level-variables";
export class Result {
  fileName: string;
  topLevel: TopLevelVariablesResult;
  methods: MethodsResult;
  bindings: BindingsResult;
  constructor(
    topLevel: TopLevelVariablesResult,
    methods: MethodsResult,
    bindings: BindingsResult,
    fileName: string
  ) {
    this.topLevel = topLevel;
    this.bindings = bindings;
    this.methods = methods;
    this.fileName = fileName;
  }
}
