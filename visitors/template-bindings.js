let utils = require("../utils");
const {
  BindingToName,
  TemplateBinding,
  TemplateBindings,
} = require("../models/visitors");

//TODO delete me, logging not crampled
require("util").inspect.defaultOptions.depth = null;

//TODO correct way to store
let bindings = [];
let names = [];
let currentId = undefined;

module.exports = {
  bindings,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      //new html tag, set target to its id
      VElement(elem) {
        currentId = utils.id(elem);
      },
      // all plain text inside elements
      "VElement VText"(node) {
        let name = node.value.trim();
        if (name) names.push(new BindingToName(currentId, name));
      },
      //two way binding, also include html tag -> variable. the other one is handled below
      "VAttribute[key.name.name=model] VExpressionContainer Identifier"(node) {
        bindings.push(new TemplateBinding(currentId, node.name));
      },

      //all identifiers, needs info on which are methods and not
      "VExpressionContainer Identifier"(node) {
        bindings.push(new TemplateBinding(node.name, currentId));
      },
      "VElement[name=template]:exit"(node) {
        let result = new TemplateBindings(bindings, names);
        context.report({ node: node, message: JSON.stringify(result) });
      },
    });
  },
};
