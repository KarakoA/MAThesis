let utils = require("../utils");
const { Tag } = require("../models/visitors");
const { vForExpression } = require("../utils");
require("util").inspect.defaultOptions.depth = null;
function determineNodeName(node, firstBindingName = undefined) {
  //simple name, raw string
  let firstVText = node.children
    .find((x) => x.type === "VText" && x.value.trim())
    ?.value.trim();

  // if both fail, just the name of the node
  let name = firstVText ?? firstBindingName ?? node.name;
  return name;
}

function substituteVFor(replacements, data) {
  console.log(replacements);
  //TODO rethink this. problem.a => problems.a currently
  //should be problems[i].a
  replacements.forEach((replacement) => {
    data.forEach((x) =>
      x.item.id.replaceFront(replacement.left, replacement.right)
    );
  });
}

class BindingsState {
  constructor() {
    this.reset();
  }
  reset() {
    this.bindings = new Map();
    this.latest = [];
    this.VForReplacement = [];
  }

  identifierOrExpressionNew(node, bindingType) {
    let item = utils.methodOrProperty(node);
    this.latest.push({ item, bindingType });
  }

  elementWithVForStarted(vforAttributeNode) {
    //item in items
    //item
    //TODO problems with (item1, item2) in items....
    //TODO can it be items in problems[0]? how would I resolve that one? Should be possible
    //also how to add i accesses, see problem above
    let left = utils.getNameFromExpression(vforAttributeNode.left[0]);
    //items
    let right = utils.getNameFromExpression(vforAttributeNode.right);
    this.VForReplacement.unshift({ left, right });
  }

  elementWithVForExited() {
    this.VForReplacement.shift();
  }

  nodeExited(node) {
    if (this.latest.length != 0) {
      let id = utils.id(node);

      substituteVFor(this.VForReplacement, this.latest);

      let firstBindingName = this.latest[0].item.id.toString();

      let name = determineNodeName(node, firstBindingName);
      //TODO could apply the substitution on it for more info, but maybe don't even need this at all, will see
      //let position = this.VForReplacement[0];

      let position = this.VForReplacement.length == 0 ? undefined : "i";
      let tag = new Tag(id, node.loc, position, name);

      this.bindings.set(tag, this.latest);
      this.latest = [];
    }
  }

  finish() {
    return this.bindings;
  }
}

module.exports = { BindingsState };
