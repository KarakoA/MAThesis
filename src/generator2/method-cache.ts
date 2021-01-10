import { isProperty, Method, Property } from "../parsing/models/shared";
import { MethodResolver } from "./method-resolver";
import {
  CalledMethod,
  ResolvedMethodDefintition,
} from "./models/method-resolver";
import _ from "lodash/fp";
export class MethodCache {
  resolver: MethodResolver;
  result: (ResolvedMethodDefintition | Property)[];
  done: (Method | CalledMethod)[];
  constructor(resolver: MethodResolver) {
    this.resolver = resolver;
    this.result = [];
    this.done = [];
  }

  allCalledMethods(): ReadonlyArray<ResolvedMethodDefintition | Property> {
    return this.result;
  }

  //TODO test with onClick="problems.push()" or similar, that should return "property"
  called(e: Method): ResolvedMethodDefintition {
    const resolved = this.calledRec(e);
    if (!resolved) throw new Error(`Failed to resolve ${e}!`);
    return resolved;
  }
  private contains(m: Method | CalledMethod): boolean {
    return _.find(_.isEqual(m), this.done) !== undefined;
  }
  private calledRec(
    e: Method | CalledMethod
  ): ResolvedMethodDefintition | undefined {
    const resolved = this.resolver.called(e);
    this.done.push(e);
    if (!resolved) return undefined;
    this.result.push(resolved);
    if (isProperty(resolved)) return undefined;
    //call recursively for called, that are not processed yet
    resolved.calls
      .filter((x) => !this.contains(x))
      .map((x) => this.calledRec(x));
    return resolved;
  }
}
