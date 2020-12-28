const assert = require("assert");

const utils2 = require("../utils2");

const lodash = require("lodash");

class Identifiers {
  static create(data) {
    assert(data.length > 0);
    return data;
  }

  static toString(that, includeThis = true) {
    return lodash.reduce(
      that,
      (acc, c) => {
        let string = Identifier.toString(c, includeThis);
        if (!acc) return string;
        return c.type == identifierTypes.POSITION
          ? acc.concat(string)
          : acc.concat("." + string);
      },
      ""
    );
  }

  static startsWithThis(that) {
    return lodash.head(that)?.type === identifierTypes.THIS;
  }
  static startsWith(that, start) {
    assert(start.length > 0);
    if (start.length > that.length) return false;

    let startActual = lodash.take(that, start.length);
    return lodash.isEqual(startActual, start);
  }

  static prefixThis(that) {
    return this.startsWithThis(that)
      ? that
      : this.prefix(that, Identifier.createThis());
  }
  static prefix(that, prefix) {
    return lodash.compact(lodash.concat(prefix, that));
  }
  static replaceFront(that, subList, replacement) {
    //replace only if starts with
    return Identifiers.startsWith(that, subList)
      ? this.prefix(lodash.drop(that, subList.length), replacement)
      : that;
  }

  static replaceLast(that, replacement) {
    return lodash.dropRight(that, 1).concat(replacement);
  }

  static addPosition(that) {
    const last = lodash.last(that);
    const nextPosition = Identifier.nextPosition(last);
    return that.concat(nextPosition);
  }
}

const identifierTypes = {
  POSITION: "pos",
  ID: "id",
  THIS: "this",
};

class Identifier {
  static createPosition(name) {
    return this.create({ name, type: identifierTypes.POSITION });
  }

  static createThis() {
    return this.create({ name: "this", type: identifierTypes.THIS });
  }

  static createIdentifier(name) {
    return this.create({ name, type: identifierTypes.ID });
  }

  static create({ name, type }) {
    assert(name || name >= 0);
    assert(type);
    return { name, type };
  }

  static nextPosition(that) {
    return this.createPosition(utils2.nextChar(this.positionName(that)));
  }
  static positionName(that) {
    return that?.type === identifierTypes.POSITION ? that.name : undefined;
  }

  static isPosition(that) {
    return that.type === identifierTypes.POSITION;
  }
  static nonPosition(that) {
    return !this.isPosition(that);
  }

  static toString(that, includeThis = true) {
    if (!includeThis & (that.type == identifierTypes.THIS)) return "";

    return that.type === identifierTypes.POSITION
      ? `[${that.name}]`
      : that.name;
  }
}
module.exports = { Identifier, Identifiers, identifierTypes };
