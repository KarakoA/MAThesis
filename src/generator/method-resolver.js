const { method } = require("lodash");
const lodash = require("lodash");
const { IdentifierChain, Identifier } = require("../models/visitors");

class MethodResolver {
  constructor(methods) {
    this.methods = new Map();
    methods.forEach((x) => (methods[x.name] = x));

    this.resolved = new Map();

    //        cache:(method,args) => {R,W,C(method,args)}
    //args: this expr. or any
  }
  initResolved(methods) {
    //all without args
    methods
      .filter(
        (m) =>
          lodash.isEmpty(m.args) &&
          lodash.every(m.calls, (x) => lodash.isEmpty(x.args))
      )
      .forEach((m) => (this.resolved[m] = m));
  }
  //simplify calls in 4 ways: this.XYZ, "same", "other", "nothing"
  //compute this for every method in methods, "OR" compute lazily once called
  //calls can also be nested, so recursive for sure

  resolve(methods, resolved = new Map()) {
    if (lodash.isEmpty(methods)) return resolved;
    let head = lodash.head(methods);
    let tail = lodash.drop(methods, 1);

    let headResolved = this.resolve(head);
    this.resolve(tail, resolved.concat(headResolved));
  }

  resolve2(method) {
    method.calls.map((x) => (arg) => {
      arg: this.resolveArg;
    });
  }

  //up to last i same, last can vary

  resolveArg(arg) {
    if (arg.type === "method") return () => "method";
    if (arg.type === "property")
      //TODO check
      return (methodArg) => {
        if (IdentifierChain.startsWith(arg, methodArg))
          new IdentifierChain(...arg);
        return "other";
      };
  }

  //ignored for now:
  //A(asdf) calls B(asdf)
  //B(asdf) calls A(asdf)
  // -> results in endless loop, even though B(asdf) could have if(asdf) return 0 and later have A(asdf). would not know
}

const types = {
  METHOD: "method",
  OTHER: "other",
};

module.exports = { MethodResolver };
