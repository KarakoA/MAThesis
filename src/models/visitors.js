const assert = require("assert");

const utils2 = require("../utils2");

const { isEqual, uniqWith } = require("lodash");

class BindingToName {
  constructor(id, name, loc) {
    this.id = id;
    this.name = name;
    this.loc = loc;
  }
}

class TemplateBinding {
  constructor(source, target, isEventBinding = false) {
    this.source = source;
    this.target = target;
    this.isEventBinding = isEventBinding;
  }
}
const bindingType = {
  EVENT: "event",
  ONE_WAY: "one-way",
  TWO_WAY: "two-way",
};

const dataType = {
  REFERENCE: "reference",
  VALUE: "value",
};

class Access {
  constructor(id) {
    assert(id);
    this.id = id;
  }
  cond() {
    throw new Error("Implementation is missing");
  }
}

class MethodAccess extends Access {
  //id is of type identifier chain
  constructor(id, args = []) {
    super(id);
    this.args = args;
  }
  cond(onMethod) {
    return onMethod(this);
  }
}

class PropertyAccess extends Access {
  constructor(id) {
    super(id);
  }
  cond(_onMethod, onProperty) {
    return onProperty(this);
  }
}

class IdentifierChain {
  constructor(identifiers) {
    assert(identifiers?.length > 0);
    this.identifiers = identifiers;
  }

  toString() {
    return this.identifiers.map((x) => x.toString()).join(".");
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
    assert(subList.length > 0);
    let n = subList.length;
    //TODO can without, use lists for both
    let firstN = new IdentifierChain(this.identifiers.slice(0, n));

    if (isEqual(firstN, subList))
      this.identifiers.splice(0, n, replacement.identifiers);
    // else throw new Error(`Sublist did not match!`);
  }
}
class Identifier {
  constructor(name, positions = undefined) {
    assert(name);
    this.name = name;
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
    return this.positions
      ? `${this.name}${this.positions.map((x) => `[${x}]`).join("")}`
      : this.name;
  }
}

/*class Position {
  constructor(index) {
    assert(index);
    let n = Number(index);
    assert(n >= 0);
    this.index = n ?? "i";
  }
}*/
class Tag {
  constructor(id, loc, position = undefined, name = undefined) {
    assert(id);
    this.id = id;
    this.name = name;
    this.loc = loc;
    this.position = position;
  }
}

//TODO accessors all/single for lists , as part of binding instead of boolean
//for methods need params

//

/*
ADTs
BindingType: {EVENT, TWO_WAY, ONE_WAY}


Property: {id, name:Option[String], position:Option[String]//i or positive number }
Method: {id, name, args:Option[List[Property | Method]]}

Tag: {id, name, loc, groupInfo:Option[{position:String//i or positive number}]}

, groupId?

//NOTE graphically enumerate tags maybe?

Bindings:
Map: Property -> Tag : BindingType
List[(Property, Tag, BindingType)]

Top Level:
Data: Map of Property -> DataType

Methods:
//Declaration, handled as assignment (no statement for declaration, but just assignemnts to values)
//if just let xyz, to undefined
argsnames: List[String]
Returns:List[Property | Method]
List[Assignment{prop, to:List[Property | Method ]}] //writes, RHS
Calls:List[Method]
Reads:List[Property]
Writes - computed later based on assignment and arg of method


//NODE multiple on one line? => split to array


*/

class TemplateBindings {
  constructor(bindings, tagsInfo) {
    this.bindings = bindings;
    this.tagsInfo = tagsInfo;
  }
}

class TopLevel {
  constructor(variableNames, methodNames, calledInInit) {
    this.variableNames = variableNames;
    this.methodNames = methodNames;
    this.calledInInit = calledInInit;
  }
}

class Methods {
  constructor(init, computed, methods) {
    this.init = init;
    this.computed = computed;
    this.methods = methods;
  }
}

class Method {
  constructor(name, args, reads, writes, calls) {
    this.name = name;
    this.args = args;
    this.writes = uniqWith(writes, isEqual);
    this.reads = uniqWith(reads, isEqual);
    this.calls = uniqWith(calls, isEqual);
  }
}
class Init {
  constructor(methods) {
    this.init = methods.methods[0] ?? undefined;
  }
}
class Computed {
  constructor(methods) {
    this.computed = methods.methods;
  }
}
module.exports = {
  TemplateBinding,
  TemplateBindings,
  BindingToName,
  TopLevel,
  Method,
  Methods,
  Init,
  Computed,
  //NEW ONES
  MethodAccess,
  PropertyAccess,
  Tag,
  bindingType,
  dataType,
  Access,
  //Position,
  Identifier,
  IdentifierChain,
};
