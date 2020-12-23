const utils = require("../utils");
const { Method, Methods } = require("../models/visitors");
const assert = require("assert");

const accessType = {
  WRITES: "writes",
  CALLS: "calls",
  DECLARES: "declares",
  ALL: "all",
};

class FunctionState {
  constructor() {
    this.reset();
  }
  reset() {
    this.methodName = undefined;
    this.allNames = new Set();

    this.methods = [];
    this.latest = [];
  }
  newMethod(methodName) {
    this.methodName = methodName;
    this.allNames.add(this.methodName);
  }

  identifierOrExpressionNew(node, accessType) {
    let name = utils.getNameFromExpression(node);
    this.latest.push({ name, accessType });
  }

  filterOrEmpty(data, accessType) {
    return (
      data.filter((x) => x.accessType === accessType)?.map((x) => x.name) ?? []
    );
  }
  nodeExited() {
    if (this.latest.length != 0) {
      let writes = this.filterOrEmpty(this.latest, accessType.WRITES);
      let calls = this.filterOrEmpty(this.latest, accessType.CALLS);
      let all = this.filterOrEmpty(this.latest, accessType.ALL);

      let declares = this.filterOrEmpty(this.latest, accessType.DECLARES);

      let reads = this.computeReads(writes, calls, declares, all);

      this.methods.push(
        new Method(this.methodName, [...reads], [...writes], [...calls])
      );
      this.methodName = undefined;
    }
  }

  finished() {
    let methods = new Methods(this.methods);
    //TODO check this is not null
    this.reset();
    return methods;
  }

  computeReads(writes, calls, declares, all) {
    let other = writes.concat(calls).concat(declares);
    // reads equalts to  all except write and calls
    //marking for each once
    let reads = [...all];
    other.forEach((el) => {
      let i = reads.findIndex((x) => x == el);
      //i should always be found
      assert(i != -1);
      reads.splice(i, 1);
    });
    return reads;
    // reads equalts to  all except write and calls
    //   return [...all].filter((x) => !(calls.has(x) || writes.has(x)));
  }
}

module.exports = { FunctionState, accessType };
