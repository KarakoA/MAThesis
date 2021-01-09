import lodash from "lodash";
import { Identifiers } from "../models/identifiers";
import assert from "assert";

export class MethodResolver {
  constructor(methods, topLevel) {
    this.methods = methods;
    this.topLevel = topLevel;
  }

  //TODO abstract
  called({ id, args }) {
    let method = this.methods.find(
      (x) =>
        lodash.isEqual(x.name, id) ||
        //TODO not nice
        lodash.isEqual(Identifiers.prefixThis(x.name), id)
    );

    //TODO @this.problems.push() how to handle those
    if (!method) return undefined;

    assert(method.args.length == args?.length);

    let callsOrMethodCallOfTopLevel = method.calls.map((x) => {
      return { ...x, topLevel: this.startsWithTopLevelVar(x) };
    });

    //TODO @Future if I do myMethod(problem) and then have problem.push() won't be recognized by this

    //assumes mutation, returned as writes
    let methodCallOfTopLevel = callsOrMethodCallOfTopLevel
      .filter((x) => x.topLevel)
      .map((x) => x.topLevel.id)
      .map((x) => this.maybePrefixThis(x));

    let calls = callsOrMethodCallOfTopLevel
      .filter((x) => !x.topLevel)
      .map((m) => {
        let mArgs = m.args.map((arg) => {
          this.resolveArg(arg, method.args, args);
        });
        return { id: m.id, args: mArgs };
      })
      .filter((x) => Identifiers.startsWithThis(x.id));

    //TODO abstract
    let reads = method.reads
      .map((x) => x.id)
      .map((x) => this.maybeSubstitudeArgs(x, method.args, args))
      .map((x) => this.maybePrefixThis(x))
      .filter((x) => Identifiers.startsWithThis(x));

    let writes = method.writes
      .map((x) => x.id)
      .map((x) => this.maybeSubstitudeArgs(x, method.args, args))
      .map((x) => this.maybePrefixThis(x))
      .filter((x) => Identifiers.startsWithThis(x));
    return {
      id: Identifiers.prefixThis(id),
      //TODO @maybe
      args: args.map((x) => this.maybePrefixThis(x)),
      calls,
      reads,
      writes: writes.concat(methodCallOfTopLevel),
    };
  }

  startsWithTopLevelVar(x) {
    let name = Identifiers.startsWithThis(x.id) ? lodash.tail(x.id) : x.id;
    let found = lodash.find(this.topLevel, (topLevel) =>
      Identifiers.startsWith(name, topLevel.id)
    );
    return found;
  }

  maybePrefixThis(x) {
    //TODO can one access computed properties in code? if so, check for those here as well probably
    return lodash.some(this.topLevel, (topLevel) =>
      Identifiers.startsWith(x, topLevel.id)
    )
      ? Identifiers.prefixThis(x)
      : x;
  }
  maybeSubstitudeArgs(x, methodArgs, calledArgs) {
    let i = methodArgs.findIndex((arg) => Identifiers.startsWith(x, arg));
    if (i != -1)
      return Identifiers.replaceFront(x, methodArgs[i], calledArgs[i]);
    return x;
  }

  resolveArg(arg, methodArgs, calledArgs) {
    if (arg.type === "method") return "method";
    //TODO check with undefined
    if (arg.type === "property") {
      let foundIndex = lodash.findIndex(methodArgs, (methodArg) =>
        Identifiers.startsWith(arg.id, methodArg)
      );
      if (foundIndex != -1)
        return Identifiers.replaceFront(
          arg.id,
          methodArgs[foundIndex],
          calledArgs[foundIndex]
        );
      else return "other";
    }
    throw new Error("Unknown arg type!");
  }
}
