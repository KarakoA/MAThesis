const assert = require("assert");
const lodash = require("lodash");

const bindingType = {
  EVENT: "event",
  ONE_WAY: "one-way",
  TWO_WAY: "two-way",
};

const dataType = {
  ARRAY: "array",
  OTHER: "other",
};

class Access {
  constructor(id, type) {
    assert(id);
    assert(type);
    this.id = id;
    this.type = type;
  }
}

class MethodAccess extends Access {
  //id is of type identifier chain
  constructor(id, args = []) {
    super(id, "method");
    this.args = args;
  }
}

class PropertyAccess extends Access {
  constructor(id) {
    super(id, "property");
  }
}

class Tag {
  constructor(id, loc, position = undefined, name = undefined) {
    assert(id);
    this.id = id;
    this.name = name;
    this.loc = loc;
    this.position = position;
  }
}
class TopLevelVariable {
  constructor(id) {
    assert(id);
    this.id = id;
  }
}

class Method {
  constructor(name, args, reads, writes, calls) {
    this.name = name;
    this.args = args;
    this.writes = lodash.uniqWith(writes, lodash.isEqual);
    this.reads = lodash.uniqWith(reads, lodash.isEqual);
    this.calls = lodash.uniqWith(calls, lodash.isEqual);
  }
}

module.exports = {
  Method,
  //NEW ONES
  MethodAccess,
  PropertyAccess,
  Tag,
  bindingType,
  dataType,
  Access,
  TopLevelVariable,
};
