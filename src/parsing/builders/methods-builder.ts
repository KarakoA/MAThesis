import * as utils from "../utils";

import assert from "assert";
import _ from "lodash/fp";
import {
  isMethod,
  Method,
  Property,
  Entity,
  isProperty,
} from "../models/shared";
import { AST } from "vue-eslint-parser";
import { AST_NODE_TYPES } from "@typescript-eslint/types";
import { MethodDefinition, MethodsResult } from "../models/methods";

import { Identifiers, prefixThis } from "../../common/models/identifiers";

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
  //also includes methods, but since only identifiers are stored,
  //they are resolved to properties
  all: Property[];

  writes: Property[];
  calls: Method[];
  declares: Entity[];
  objectProps: Entity[];

  id: Identifiers;
  args: Property[];
  methodType: MethodType;

  allExceptReads(): Entity[] {
    return [
      ...this.writes,
      ...this.calls,
      ...this.declares,
      ...this.objectProps,
      ...this.args,
    ];
  }

  reads(): Property[] {
    const other = this.allExceptReads();

    const reads = [...this.all];
    other.forEach((el) => {
      const i = reads.findIndex((x) => _.isEqual(x.id, el.id));
      assert(i != -1);

      reads.splice(i, 1);
    });
    return reads;
  }

  add(item: Entity, accessType: AccessType) {
    switch (accessType) {
      case AccessType.ALL:
        if (isProperty(item)) this.all.push(item);
        else throw new Error(`All can only contain properties! Got method.`);
        break;
      case AccessType.CALLS:
        if (isMethod(item)) this.calls.push(item);
        else throw new Error(`Calls can only contain methods! Got property.`);
        break;
      case AccessType.DECLARES:
        this.declares.push(item);
        break;
      case AccessType.WRITES:
        if (isProperty(item)) this.writes.push(item);
        else throw new Error(`Calls can only contain methods! Got property.`);
        break;
      case AccessType.OBJECT_PROPERTY:
        this.objectProps.push(item);
        break;
      default:
        throw new Error(`Unknown access type ${accessType}`);
    }
  }

  constructor(id: Identifiers, args: Property[], methodType: MethodType) {
    this.id = id;
    this.args = args;
    this.methodType = methodType;

    this.all = [];
    this.writes = [];
    this.calls = [];
    this.declares = [];
    this.objectProps = [];
  }
  build(): MethodDefinition {
    return {
      id: prefixThis(this.id),
      args: this.args,
      reads: _.uniqWith(_.isEqual, this.reads()),
      writes: _.uniqWith(_.isEqual, this.writes),
      calls: _.uniqWith(_.isEqual, this.calls),
    };
  }
}

export class MethodsBuilder {
  methods!: MethodDefinition[];
  computed!: MethodDefinition[];
  init?: MethodDefinition;

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

  add(method: MethodDefinition, type: MethodType): void {
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
    const id = utils.identifiers(node.key as utils.SupportedNamedExpression);
    this.latestMethodBuilder = new MethodDefintitionBuilder(
      id,
      args,
      methodType
    );
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
    const methods: MethodsResult = {
      computed: this.computed,
      methods: this.methods,
      init: this.init,
    };
    this.reset();
    return methods;
  }
}
