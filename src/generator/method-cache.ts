import { isProperty, Method, Property } from "../parsing/models/shared";
import { MethodResolver } from "./method-resolver";
import {
  CalledMethod,
  ResolvedMethodDefinition,
} from "./models/method-resolver";
import _ from "lodash/fp";
import { render } from "../common/models/identifiers";
export class MethodCache {
  resolver: MethodResolver;
  result: ResolvedMethodDefinition[];
  done: (Method | CalledMethod)[];
  constructor(resolver: MethodResolver) {
    this.resolver = resolver;
    this.result = [];
    this.done = [];
  }

  allCalledMethods(): ReadonlyArray<ResolvedMethodDefinition> {
    return this.result;
  }

  called(e: Method): ResolvedMethodDefinition | Property {
    const resolved = this.calledRec(e);
    if (!resolved) throw new Error(`Failed to resolve "${render(e.id)}" !`);
    return resolved;
  }
  private contains(m: Method | CalledMethod): boolean {
    return _.find(_.isEqual(m), this.done) !== undefined;
  }
  private calledRec(
    e: Method | CalledMethod
  ): ResolvedMethodDefinition | Property | undefined {
    const resolved = this.resolver.called(e);
    this.done.push(e);
    if (!resolved) return undefined;
    if (isProperty(resolved)) return resolved;
    this.result.push(resolved);
    //call recursively for called, that are not processed yet
    resolved.calls
      .filter((x) => !this.contains(x))
      .map((x) => this.calledRec(x));
    return resolved;
  }
}
