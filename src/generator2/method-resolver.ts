import _ from "lodash/fp";
import * as identifiers from "../models2/identifiers";
import assert from "assert";
import {
  MethodDefintition,
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
  withId,
} from "../parsing/models/shared";
import {
  ResolvedMethodDefintition,
  ResolvedArgument,
  CalledMethod,
  isCalledMethod,
  GeneralisedArgument,
} from "./models/method-resolver";

export class MethodResolver {
  methods: MethodDefintitions;
  topLevel: TopLevelVariables;
  constructor(methods: MethodsResult, topLevel: TopLevelVariablesResult) {
    this.methods = [...methods.computed, ...methods.methods];
    if (methods.init) this.methods.push(methods.init);
    this.topLevel = topLevel.topLevel;
  }

  called(called: Method): ResolvedMethodDefintition | Property | undefined {
    //find method
    const method = this.findMethod(called);

    //not found but that's alright - e.g. Math.random() would not be found
    if (!method) return undefined;
    // it's actually a property access call (e.g. this.problems.push)
    if (isProperty(method)) return method;
    //is a
    //only properties are  method

    // double check called with correct number of arguments
    assert(method.args.length == called.args.length);

    const args = this.resolveArgs(called.args);
    const substituteId = this.substituteIdFunction(method.args, called.args);

    ///substitude reads writes and calls with those arguments and  filter out those not starting with 'this'
    const reads = method.reads
      .map((x) => {
        return { id: substituteId(x.id), discriminator: x.discriminator };
      })
      .filter((x) => identifiers.startsWithThis(x.id));

    const writes = method.reads
      .map((x) => {
        return { id: substituteId(x.id), discriminator: x.discriminator };
      })
      .filter((x) => identifiers.startsWithThis(x.id));

    //for all calls do called with the actual args from definition
    const calls = _.flatMap(
      (m: Method) => this.substituteMethod(m, substituteId) ?? []
    )(method.calls);

    // flatten it by discarding empty ones, appending properties to writes and the rest to calls
    const callsProperties = _.filter(isProperty, calls);
    const callsMethods = _.filter(isCalledMethod, calls);

    return {
      id: called.id,
      args,
      calls: callsMethods,
      reads,
      writes: writes.concat(callsProperties),
    };
  }

  /**
   * Looks for the given method in method definitions and top level properties.
   * If found in method definitions, return it.
   *
   * If not and starts like a top level property, return that property instead
   * and this method is now threated as 'writes' (this assumes the call mutates the property it is called on).
   *
   * If both fail (.i.e. external method e.g. Math.random()) returns undefined.
   * @param m method
   */
  private findMethod(m: Method): MethodDefintition | undefined | Property {
    //if not a 'this' identifier, can be skipped completely
    if (identifiers.startsWithThis(m.id)) return undefined;
    //otherwise check methods
    const method = this.methods.find((x) => _.isEqual(x.id, m.id));
    //found!
    if (method) return method;
    //otherwise check top level properties
    return findLongestMatch(m.id, this.topLevel);
  }

  private resolveArgs(
    methodArgs: ReadonlyArray<Entity>
  ): ReadonlyArray<ResolvedArgument> {
    return methodArgs.map(this.resolveArg);
  }

  private resolveArg(arg: Entity): ResolvedArgument {
    if (isProperty(arg) && identifiers.startsWithThis(arg.id)) return arg;
    if (isMethod(arg)) return GeneralisedArgument.METHOD;
    return GeneralisedArgument.OTHER;
  }

  private substituteIdFunction(
    args: ReadonlyArray<Property>,
    calledArgs: ReadonlyArray<Entity>
  ): (id: identifiers.Identifiers) => identifiers.Identifiers {
    assert(args.length == calledArgs.length);
    const argsIds = args.map((x) => x.id);

    function f(id: identifiers.Identifiers): identifiers.Identifiers {
      const i = identifiers.findLongestMatchIndex(id, argsIds);
      return i != -1
        ? identifiers.replaceFront(id, args[i].id, calledArgs[i].id)
        : id;
    }
    return f;
  }

  private substituteMethod(
    m: Method,
    substituteId: (x: identifiers.Identifiers) => identifiers.Identifiers
  ): CalledMethod | Property {
    const found = this.findMethod(m);
    if (isProperty(found)) return found;
    const substitutedArgs = m.args.map((x) => withId(x, substituteId));
    const args = this.resolveArgs(substitutedArgs);

    return { id: substituteId(m.id), args };
  }
}
