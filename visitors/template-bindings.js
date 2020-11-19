let utils = require("../utils");
//TODO delete me, logging not crampled
require("util").inspect.defaultOptions.depth = null;

//TODO correct way to store
let bindings = [];
let names = []
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
        let name = node.value.trim()
        if(name)
          names.push({id:currentId,name:name})
      },
      //two way binding, also include html tag -> variable. the other one is handled below
      "VAttribute[key.name.name=model] VExpressionContainer Identifier"(node) {
        bindings.push({ source: currentId, target: node.name });
      },

      //all identifiers, needs info on which are methods and not
      "VExpressionContainer Identifier"(node) {
        bindings.push({ source: node.name, target: currentId });
      },
      "VElement[name=template]:exit"() {
        console.log({bindings,names});
      },
    });
  },
};