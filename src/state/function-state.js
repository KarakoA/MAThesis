const utils = require("../utils");
const { Method, Methods } = require("../models/visitors");
const assert = require("assert");
const { isEqual } = require("lodash");

const accessType = {
  WRITES: "writes",
  CALLS: "calls",
  DECLARES: "declares",
  OBJECT_PROPERTY: "object-property",
  ALL: "all",
};

const methodType = {
  INIT: "init",
  METHOD: "method",
  COMPUTED: "computed",
};

class FunctionState {
  constructor() {
    this.reset();
  }

  reset() {
    this.reset_partial();
    this.methods = [];
    this.init = undefined;
    this.computed = [];
  }

  reset_partial() {
    this.latest = [];
    this.method = undefined;
    this.methodType = undefined;
  }

  add(method) {
    switch (this.methodType) {
      case methodType.METHOD:
        this.methods.push(method);
        break;
      case methodType.INIT:
        assert(!this.init);
        this.init = method;
        break;
      case methodType.COMPUTED:
        this.computed.push(method);
        break;
    }
  }
  newMethod(node, methodType) {
    let args = node.value.params.map((param) =>
      utils.getNameFromExpression(param)
    );
    let name = node.key.name;
    this.method = { name, args };
    this.methodType = methodType;
  }

  identifierOrExpressionNew(node, accessType) {
    let item = utils.methodOrProperty(node);
    this.latest.push({ item, accessType });
  }

  filterOrEmpty(data, accessType) {
    return (
      data.filter((x) => x.accessType === accessType)?.map((x) => x.item) ?? []
    );
  }
  nodeExited() {
    if (this.latest.length != 0) {
      let writes = this.filterOrEmpty(this.latest, accessType.WRITES);
      let calls = this.filterOrEmpty(this.latest, accessType.CALLS);
      let all = this.filterOrEmpty(this.latest, accessType.ALL);
      let declares = this.filterOrEmpty(this.latest, accessType.DECLARES);
      let objectProps = this.filterOrEmpty(
        this.latest,
        accessType.OBJECT_PROPERTY
      );
      let reads = this.computeReads(
        writes,
        calls,
        declares,
        objectProps,
        this.method.args,
        all
      );
      let method = new Method(
        this.method.name,
        this.method.args,
        reads,
        writes,
        calls
      );
      this.add(method);
      this.reset_partial();
    }
  }

  finished() {
    let methods = {
      init: this.init,
      computed: this.computed,
      methods: this.methods,
    };
    this.reset();
    return methods;
  }

  //TODO too repetitive, better way
  computeReads(writes, calls, declares, objectProps, args, all) {
    let other = writes
      .concat(calls)
      .concat(declares)
      .concat(args)
      .concat(objectProps);
    // reads equalts to  all except write, calls, declares
    //marking for each once
    let reads = [...all];
    other.forEach((el) => {
      let i = reads.findIndex((x) => isEqual(x.id, el.id ?? el));

      // if (i == -1) {
      //   console.log(this);
      //   require("util").inspect.defaultOptions.depth = null;
      // }
      //i should always be
      assert(i != -1);

      reads.splice(i, 1);
    });
    return [...new Set(reads)];
  }
}

module.exports = { FunctionState, accessType, methodType };
