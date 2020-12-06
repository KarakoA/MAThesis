const { assert } = require("console");
const { Method, Methods } = require("./models/visitors");

class FunctionState {
  constructor() {
    this.reset();
  }
  newMethod(methodName) {
    this.methodName = methodName;
    this.allNames.add(this.methodName);
  }

  newWrites(propertyName) {
    this.writes.push({
      method: this.methodName,
      property: propertyName,
    });
  }

  newCalls(calledMethodName) {
    this.calls.push({
      method: this.methodName,
      property: calledMethodName,
    });
  }

  newAll(thisExpressionName) {
    this.all.push({
      method: this.methodName,
      property: thisExpressionName,
    });
  }
  finished() {
    let reads = this.computeReads();

    let methods = this.merge(reads, this.writes, this.calls);
    this.reset();
    return methods;
  }
  //helper methods
  reset() {
    this.methodName = undefined;
    this.allNames = new Set();
    this.writes = [];
    this.all = [];
    this.calls = [];
  }

  computeReads() {
    // reads equalts to  all except write and calls
    let reads = [...this.all];
    this.writes.concat(this.calls).forEach((el) => {
      let i = reads.findIndex(
        (x) => x.method === el.method && x.property == el.property
      );
      //i should always be found
      assert(i != -1);
      reads.splice(i, 1);
    });
    return reads;
  }
  merge(reads, writes, calls) {
    //not a very computationally efficient way of creating the mapping,
    //groupBy/map reduce would have been better
    let f = (name, methods) => [
      ...new Set(
        methods.filter((x) => x.method == name).map((x) => x.property)
      ),
    ];
    let methods = new Methods(
      [...this.allNames].map(
        (name) =>
          new Method(name, f(name, reads), f(name, writes), f(name, calls))
      )
    );
    return methods;
  }
}

module.exports = { FunctionState };
