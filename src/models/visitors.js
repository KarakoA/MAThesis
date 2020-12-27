const assert = require("assert");

const utils2 = require("../utils2");

const lodash = require("lodash");
const { isEqual } = require("lodash");

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

class IdentifierChain {
  constructor(identifiers) {
    assert(identifiers?.length > 0);
    this.identifiers = identifiers;
  }

  //TODO own class
  static toString(that) {
    return (that.identifiers ?? that)
      .map((x) => Identifier.toString(x))
      .join(".");
  }

  static startsWithStrict(that, start) {
    assert(start.length > 0);

    if (start.length > that.length) return false;

    let startActual = lodash.take(that.identifiers, start.length);
    console.log(startActual);
    return lodash.isEqual(startActual, start);
  }

  static replaceFront(that, subList, replacement) {
    assert(subList.length > 0);
    if (!IdentifierChain.startsWithStrict(that, subList)) {
      console.log(that);
      console.log(subList);
    }
    assert(IdentifierChain.startsWithStrict(that, subList));
    let n = subList.length;
    //TODO can without, use lists for both
    let firstN = new IdentifierChain(that.identifiers.slice(0, n));

    if (lodash.isEqual(firstN, subList)) {
      that.identifiers.splice(0, n, replacement.identifiers);
      that.identifiers = that.identifiers.flat();
    }
  }

  //@todo position
  //this.problems[i] and this.problems do both start with the same
  //but this.problems[i].a and this.problems.a do not, which is captured by the logic here
  //capture this

  toString() {
    return IdentifierChain.toString(this);
  }
  get length() {
    return this.identifiers.length;
  }

  addPosition() {
    let last = this.identifiers[this.length - 1];
    let char = last.positions
      ? utils2.nextChar(last.positions[last.positions.length - 1])
      : "i";
    last.addPosition(char);
  }

  //mutable, fails silently (no replace)
  replaceFront(subList, replacement) {
    return IdentifierChain.replaceFront(this, subList, replacement);
  }
}
class Identifier {
  constructor(name, positions = undefined) {
    assert(name);
    this.name = name;
    //TODO model positions as separate entity
    if (positions && !Array.isArray(positions)) positions = [positions];
    this.positions = positions;
  }
  addPosition(position) {
    assert(position);
    this.positions
      ? this.positions.push(position)
      : (this.positions = [position]);
  }

  toString() {
    return Identifier.toString(this);
  }
  static toString(that) {
    return that.positions
      ? `${that.name}${that.positions.map((x) => `[${x}]`).join("")}`
      : that.name;
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
  //Position,
  Identifier,
  IdentifierChain,
};
