import _ from "lodash/fp";
import * as identifiers from "../models2/identifiers";
import assert from "assert";
import {
  MethodDefintion,
  MethodDefintitions,
  MethodsResult,
} from "../parsing/models/methods";
import {
  TopLevelVariablesResult,
  TopLevelVariables,
  findClosestMatch as findLongestMatch,
} from "../parsing/models/top-level-variables";
import {
  Entity,
  isMethod,
  isProperty,
  Method,
  Property,
} from "../parsing/models/shared";
import {
  ResolvedMethodDefintition,
  ResolvedArgument,
  CalledMethod,
  isCalledMethod,
  GeneralisedArgument,
} from "./models/method-resolver";
import { lift } from "../utils2";

export class MethodResolver {
  methods: MethodDefintitions;
  topLevel: TopLevelVariables;
  //or CalledMethod
  //TODO ?
  handled: [identifiers.Identifiers, ResolvedMethodDefintition][];

  constructor(methods: MethodsResult, topLevel: TopLevelVariablesResult) {
    this.methods = [...methods.computed, ...methods.methods];
    if (methods.init) this.methods.push(methods.init);
    this.topLevel = topLevel.topLevel;
    this.handled = [];
  }

  /**
   * Resolves a called method and returns a {@link ResolvedMethodDefinition}.
   * Reads, writes and calls of the resolved method only include methods and properties starting with
   * `this`.
   * Arguments of called methods are transformed/abstracted as well and only include `this` properties
   * or {@link GeneralisedArgument}, instead of methods and properties.
   * @param called id of called method, including the args it has been called with
   */
  called(
    called: Method | CalledMethod
  ): ResolvedMethodDefintition | Property | undefined {
    let method: MethodDefintion;
    let resolvedArgs: ReadonlyArray<ResolvedArgument>;
    if (isMethod(called)) {
      //find method
      const found = this.findMethod(called);

      //not found but that's alright - e.g. Math.random() would not be found
      if (!found) return undefined;
      // it's actually a property access call (e.g. this.problems.push)
      if (isProperty(found)) return found;
      //is a method
      method = found;
      resolvedArgs = this.resolveArgs(called.args);
    }
    //called methods must always be found, otherwise there is a programming error
    else {
      const found = this.findMethod(called);
      if (!found || isProperty(found))
        throw new Error(
          `Called Methods must always be found! Failed for: ${identifiers.render(
            called.id
          )}`
        );
      method = found;
      resolvedArgs = called.args;
    }

    // double check called with correct number of arguments
    assert(method.args.length == called.args.length);
    const substituteAndFilterOutThis = this.substituteAndFilterOutThisFunction(
      method.args,
      resolvedArgs
    );

    ///substitude reads writes and calls with those arguments and  filter out those not starting with 'this'
    const reads = _.flatMap(
      (x) => lift(substituteAndFilterOutThis(x)),
      method.reads
    );

    const writes = _.flatMap(
      (x) => lift(substituteAndFilterOutThis(x)),
      method.writes
    );

    //for all calls do called with the actual args from definition
    const calls = _.flatMap((m: Method) =>
      lift(this.substituteMethod(m, substituteAndFilterOutThis))
    )(method.calls);

    // flatten it by discarding empty ones, appending properties to writes and the rest to calls
    const callsProperties = _.filter(isProperty, calls);
    const callsMethods = _.filter(isCalledMethod, calls);

    return {
      id: called.id,
      args: resolvedArgs,
      calls: callsMethods,
      reads,
      writes: writes.concat(callsProperties),
    };
  }

  /**
   * Looks for the given method in method definitions and top level properties.
   * If found in method definitions, return it.
   *
   * If it's a method call on a top level property, returns that property instead.
   * and this method is now threated as 'writes' (this assumes the call mutates the property it is called on).
   *
   * If both fail (.i.e. external method e.g. Math.random()) returns undefined.
   * @param m method
   */
  private findMethod(
    m: Method | CalledMethod
  ): MethodDefintion | undefined | Property {
    //if not a 'this' identifier, can be skipped completely (all known methods in `methods` start with `this`)
    if (!identifiers.startsWithThis(m.id)) return undefined;
    //otherwise check methods
    const method = this.methods.find((x) => _.isEqual(x.id, m.id));
    //found!
    if (method) return method;
    //otherwise check top level properties
    return findLongestMatch(m.id, this.topLevel);
  }
  /**
   * Returns a function, which can be used to substitude identifiers inside a method
   * with the actual value of those arguments, that method was called with.
   * If substitution is not possible, identity is taken instead.
   * It then returns unindentified for those, that don't start with this after substitution.
   * This must be applied to all accessed methods and properties: reads, writes, calls (and arguments of calls)
   * @param args of the method definition
   * @param calledArgs what the method was invoked with
   */
  private substituteAndFilterOutThisFunction(
    args: ReadonlyArray<Property>,
    calledArgs: ReadonlyArray<ResolvedArgument>
  ): <T extends Entity>(x: T) => T | undefined {
    assert(args.length == calledArgs.length);
    const argsIds = args.map((x) => x.id);

    function f<T extends Entity>(x: T): T | undefined {
      const i = identifiers.findLongestMatchIndex(x.id, argsIds);
      //no match, shouldn't be substituted, just check if it starts with `this`
      if (i == -1) return identifiers.startsWithThis(x.id) ? x : undefined;

      const calledArg = calledArgs[i];
      //replacement is not a property, irrelevant
      if (!isProperty(calledArg)) return undefined;
      //replace with property
      const id = identifiers.replaceFront(x.id, args[i].id, calledArg.id);
      //if doesn't start with `this`, irrelevant
      return identifiers.startsWithThis(id) ? { ...x, id } : undefined;
    }
    return f;
  }

  /**
   * Substitutes a method and resolves it's arguments.
   * @param method method
   * @param substituteAndFilterOutThis substitution function
   */
  private substituteMethod(
    method: Method,
    substituteAndFilterOutThis: <T extends Entity>(x: T) => T | undefined
  ): CalledMethod | Property | undefined {
    const subMethod = substituteAndFilterOutThis(method);
    //is not a `this` method, can be discarded
    if (!subMethod) return undefined;

    const found = this.findMethod(subMethod);
    //is actually a method call on a property, return the property
    if (isProperty(found)) return found;

    //substitute arguments and then resolve that
    const substitutedArgs = subMethod.args.map((x) => {
      const sub = substituteAndFilterOutThis(x);
      //if substitution successful resolve the substituted argument, otherwise resolve the original one
      return sub ? this.resolveArg(sub) : this.resolveArg(x);
    });

    return { id: subMethod.id, args: substitutedArgs };
  }
  /**
   * Invokes {@link #resolveArg()} for each argument.
   * @param methodArgs argument
   */
  private resolveArgs(
    methodArgs: ReadonlyArray<Entity>
  ): ReadonlyArray<ResolvedArgument> {
    return methodArgs.map(this.resolveArg);
  }

  /**
   * Resolves the given arguments.
   * Properties, that start with `this` are kept.
   * Methods are mapped to a generic constant.
   * Properties, that don't start with `this` get are mapped to a genereic constant.
   * @param arg argument to resolve
   */
  private resolveArg(arg: Entity): ResolvedArgument {
    if (isProperty(arg) && identifiers.startsWithThis(arg.id)) return arg;
    if (isMethod(arg)) return GeneralisedArgument.METHOD;
    return GeneralisedArgument.OTHER;
  }
}
