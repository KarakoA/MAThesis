const lodash = require("lodash");
const { Identifiers, Identifier } = require("../models/identifiers.js");
const assert = require("assert");

class MethodResolver {
  constructor(methods, topLevel) {
    this.methods = methods;
    this.topLevel = topLevel;
  }

  called({ id, args }) {
    let method = this.methods.find((x) => lodash.isEqual(x.name, id));
    assert(method);
    assert(method.args.length == args.length);

    let calls = method.calls.map((m) => {
      let mArgs = m.args.map((arg) => this.resolveArg(arg, method.args, args));
      return { id: m.id, args: mArgs };
    });

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

    return { id: Identifiers.prefixThis(id), args: args, calls, reads, writes };
  }

  maybePrefixThis(x) {
    lodash.some(this.topLevel, (topLevel) => {
      return Identifiers.startsWith(x, topLevel.id);
    });

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
      else "other";
    }
    throw new Error("Unknown arg type!");
  }
}

module.exports = { MethodResolver };
