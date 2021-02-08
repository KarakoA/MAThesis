import { MethodsResult } from "./methods";
import { BindingsResult } from "./template-bindings";
import { TopLevelPropertiesResult } from "./top-level-properties";
export class Result {
  fileName: string;
  topLevel: TopLevelPropertiesResult;
  methods: MethodsResult;
  bindings: BindingsResult;
  constructor(
    topLevel: TopLevelPropertiesResult,
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
