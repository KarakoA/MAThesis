let utils = require("../utils");
const {
  BindingToName,
  TemplateBinding,
  TemplateBindings,
} = require("../models/visitors");


let bindings = [];
let boundHtmlTags = new Set();
let names = [];
let currentId = undefined

module.exports = {
  create(context) {
    //TODO check if <span></span>{{property }} syntax is supported
    //TODO check if self closing handled

    return context.parserServices.defineTemplateBodyVisitor({
      // click handlers
      "VAttribute[key.name.name=on] > VExpressionContainer > Identifier"(node) {
        boundHtmlTags.add(currentId);
        bindings.push(new TemplateBinding(currentId, node.name, true));
      },
      //other identifiers
      ":not(VAttribute[key.name.name=on]) >  VExpressionContainer  Identifier"(
        node
      ) {
        boundHtmlTags.add(currentId);
        bindings.push(new TemplateBinding(node.name, currentId));
      },
      //two way binding, also include html tag -> variable. the other one is handled below
      "VAttribute[key.name.name=model] > VExpressionContainer > Identifier"(
        node
      ) {
        boundHtmlTags.add(currentId);
        bindings.push(new TemplateBinding(currentId, node.name));
      },

      // all html tags
      VElement(node) {
        
        let id = utils.id(node)
        currentId = id;
        
        //simple name, raw string
        let firstVText = node.children
          .find((x) => x.type === "VText" && x.value.trim())
          ?.value.trim();

        // moustache property
        let firstVExpressionContainer = () =>
          node.children.find((x) => x.type == "VExpressionContainer")
            ?.expression?.name;

        // if both fail, just the name of the node
        let name =
          firstVText ?? firstVExpressionContainer() ?? node.name;
        names.push(new BindingToName(id, name,node.loc));
      },
      //last node on the way to top
      "VElement[name=template]:exit"(node) {
        let tagsInfo = names.filter((x) => boundHtmlTags.has(x.id));
        let result = new TemplateBindings(bindings, tagsInfo);

        context.report({ node: node, message: JSON.stringify(result) });
      },
    });
  },
};
