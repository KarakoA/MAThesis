let utils = require("../utils");
const { Tag } = require("../models/visitors");

function determineNodeName(node, firstBindingName = undefined) {
  //simple name, raw string
  let firstVText = node.children
    .find((x) => x.type === "VText" && x.value.trim())
    ?.value.trim();

  // if both fail, just the name of the node
  let name = firstVText ?? firstBindingName ?? node.name;
  return name;
}

class BindingsState {
  constructor() {
    this.reset();
  }
  reset() {
    this.bindings = new Map();
    this.latest = [];
  }

  identifierOrExpressionNew(node, bindingType) {
    let item = utils.methodOrProperty(node);
    this.latest.push({ item, bindingType });
  }

  nodeExited(node) {
    if (this.latest.length != 0) {
      let id = utils.id(node);

      let firstBindingName = this.latest[0].id.toString();

      let name = determineNodeName(node, firstBindingName);
      let tag = new Tag(id, node.loc, undefined /*TODO position */, name);
      //TODO call sub and replace the head of the chain?
      //what if nested?
      this.bindings.set(tag, this.latest);
      this.latest = [];
    }
  }

  finish() {
    return this.bindings;
  }
}

module.exports = { BindingsState };
