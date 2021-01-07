import * as utils from "../utils";

import assert from "assert";
import _ from "lodash/fp";
import { Method, Property } from "../models/shared";
import { AST } from "vue-eslint-parser";
import { AST_NODE_TYPES } from "@typescript-eslint/types";
import { MethodDefintition, MethodsResult } from "../models/methods";

import * as util from "util";
util.inspect.defaultOptions.depth = 13;
export enum AccessType {
  WRITES,
  CALLS,
  DECLARES,
  OBJECT_PROPERTY,
  ALL,
}
export enum MethodType {
  INIT,
  METHOD,
  COMPUTED,
}

class MethodDefintitionBuilder {
  all: (Method | Property)[];

  writes: (Method | Property)[];
  calls: Method[];
  declares: (Method | Property)[];
  objectProps: (Method | Property)[];

  method: Method;
  methodType: MethodType;

  allExceptReads(): (Method | Property)[] {
    return [
      ...this.writes,
      ...this.calls,
      ...this.declares,
      ...this.objectProps,
      ...this.method.args,
    ];
  }

  reads(): (Method | Property)[] {
    const other = this.allExceptReads();
    const reads = [...this.all];
    other.forEach((el) => {
      const i = reads.findIndex((x) => _.isEqual(x.id, el.id));
      assert(i != -1);

      reads.splice(i, 1);
    });
    return reads;
  }

  add(item: Method | Property, accessType: AccessType) {
    switch (accessType) {
      case AccessType.ALL:
        this.all.push(item);
        break;
      case AccessType.CALLS:
        if (item instanceof Method) this.calls.push(item);
        else throw new Error(`Calls can only contain methods! Got property.`);
        break;
      case AccessType.DECLARES:
        this.declares.push(item);
        break;
      case AccessType.WRITES:
        this.writes.push(item);
        break;
      case AccessType.OBJECT_PROPERTY:
        this.objectProps.push(item);
        break;
      default:
        throw new Error(`Unknown access type ${accessType}`);
    }
  }

  constructor(method: Method, methodType: MethodType) {
    this.method = method;
    this.methodType = methodType;

    this.all = [];
    this.writes = [];
    this.calls = [];
    this.declares = [];
    this.objectProps = [];
  }
  build(): MethodDefintition {
    return new MethodDefintition(
      this.method.id,
      this.method.args,
      this.reads(),
      this.writes,
      this.calls
    );
  }
}

export class MethodsBuilder {
  methods!: MethodDefintition[];
  computed!: MethodDefintition[];
  init?: MethodDefintition;

  latestMethodBuilder?: MethodDefintitionBuilder;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.methods = [];
    this.computed = [];
    this.init = undefined;
    this.latestMethodBuilder = undefined;
  }

  add(method: MethodDefintition, type: MethodType): void {
    switch (type) {
      case MethodType.METHOD:
        this.methods.push(method);
        break;
      case MethodType.INIT:
        assert(!this.init);
        this.init = method;
        break;
      case MethodType.COMPUTED:
        this.computed.push(method);
        break;
    }
  }
  newMethod(node: AST.ESLintProperty, methodType: MethodType): void {
    const args = (node.value as AST.ESLintFunctionExpression).params.map(
      (param) => utils.property(param as utils.SupportedNamedExpression)
    );
    const id = utils.getNameFromExpression(
      node.key as utils.SupportedNamedExpression
    );
    const method = new Method(id, args);
    this.latestMethodBuilder = new MethodDefintitionBuilder(method, methodType);
  }

  identifierOrExpressionNew(
    node: utils.SupportedNamedExpression | AST.ESLintCallExpression,
    accessType: AccessType
  ): void {
    const item =
      node.type === AST_NODE_TYPES.CallExpression
        ? utils.method(node)
        : utils.property(node);
    this.latestMethodBuilder?.add(item, accessType);
  }

  nodeExited(): void {
    if (this.latestMethodBuilder !== undefined) {
      const methodDefinition = this.latestMethodBuilder.build();
      this.add(methodDefinition, this.latestMethodBuilder.methodType);
    }
  }

  build(): MethodsResult {
    const methods = new MethodsResult(this.computed, this.methods, this.init);
    this.reset();
    return methods;
  }
}
