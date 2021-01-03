import assert from "assert";
import lodash from "lodash";

export const bindingType = {
  EVENT: "event",
  ONE_WAY: "one-way",
  TWO_WAY: "two-way",
};

export const dataType = {
  ARRAY: "array",
  OTHER: "other",
};

export class Access {
  constructor(id, type) {
    assert(id);
    assert(type);
    this.id = id;
    this.type = type;
  }
}

export class MethodAccess extends Access {
  //id is of type identifier chain
  constructor(id, args = []) {
    super(id, "method");
    this.args = args;
  }
}

export class PropertyAccess extends Access {
  constructor(id) {
    super(id, "property");
  }
}

export class Tag {
  constructor(id, loc, position = undefined, name = undefined) {
    assert(id);
    this.id = id;
    this.name = name;
    this.loc = loc;
    this.position = position;
  }
}
export class TopLevelVariable {
  constructor(id) {
    assert(id);
    this.id = id;
  }
}

export class Method {
  constructor(name, args, reads, writes, calls) {
    this.name = name;
    this.args = args;
    this.writes = lodash.uniqWith(writes, lodash.isEqual);
    this.reads = lodash.uniqWith(reads, lodash.isEqual);
    this.calls = lodash.uniqWith(calls, lodash.isEqual);
  }
}
