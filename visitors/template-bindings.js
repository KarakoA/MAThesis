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
let boundHtmlTags = new Set();
let names = [];
let currentId = undefined;

module.exports = {
  bindings,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      "VElement > VStartTag"() {},
      "VElement > VEndTag"() {
        currentId = undefined;
      },
      //new html tag, set target to its id
      VElement(elem) {
        currentId = utils.id(elem);
      },
      // all plain text inside elements
      "VElement VText"(node) {
        let name = node.value.trim();

        //TODO maybe add this in a proper way, to support <span></span>{{property }} syntax
        if (name) {
          let id = currentId;
          if (!id) id = utils.id(node);
          names.push(new BindingToName(id, name));
        }
      },
      // click handlers
      "VAttribute[key.name.name=on] > VExpressionContainer > Identifier"(node) {
        bindings.push(new TemplateBinding(currentId, node.name, true));
      },
      //all other with simple bindings
      ":not(VAttribute[key.name.name=on]) VElement > VExpressionContainer >Identifier"(
        node
      ) {
        let name = node.name.trim();
        if (name) names.push(new BindingToName(currentId, name));
      },
      //two way binding, also include html tag -> variable. the other one is handled below
      "VAttribute[key.name.name=model] VExpressionContainer Identifier"(node) {
        bindings.push(new TemplateBinding(currentId, node.name));
      },
      //all identifiers, needs info on which are methods and not
      "VExpressionContainer Identifier"(node) {
        boundHtmlTags.add(currentId);
        bindings.push(new TemplateBinding(node.name, currentId));
      },
      "VElement[name=template]:exit"(node) {
        let boundTagsToNames = names.filter((x) => boundHtmlTags.has(x.id));
        let result = new TemplateBindings(bindings, boundTagsToNames);
        context.report({ node: node, message: JSON.stringify(result) });
      },
    });
  },
};
