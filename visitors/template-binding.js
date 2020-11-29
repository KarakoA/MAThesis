let utils = require("../utils");
const {
  BindingToName,
  TemplateBinding,
  TemplateBindings,
} = require("../models/visitors");

let self = {};
function reset() {
  self.bindings = [];
  self.boundHtmlTags = new Set();
  self.names = [];
  self.currentId = undefined;
}
reset();

const NAME = "template-binding";

module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      // click handlers
      "VAttribute[key.name.name=on] > VExpressionContainer > Identifier"(node) {
        self.boundHtmlTags.add(self.currentId);
        self.bindings.push(
          new TemplateBinding(self.currentId, node.name, true)
        );
      },
      //other identifiers
      ":not(VAttribute[key.name.name=on]) >  VExpressionContainer  Identifier"(
        node
      ) {
        self.boundHtmlTags.add(self.currentId);
        self.bindings.push(new TemplateBinding(node.name, self.currentId));
      },
      //two way binding, also include html tag -> variable. the other one is handled below
      "VAttribute[key.name.name=model] > VExpressionContainer > Identifier"(
        node
      ) {
        self.boundHtmlTags.add(self.currentId);
        self.bindings.push(new TemplateBinding(self.currentId, node.name));
      },

      // all html tags
      VElement(node) {
        let id = utils.id(node);
        self.currentId = id;

        //simple name, raw string
        let firstVText = node.children
          .find((x) => x.type === "VText" && x.value.trim())
          ?.value.trim();

        // moustache property
        let firstVExpressionContainer = () =>
          node.children.find((x) => x.type == "VExpressionContainer")
            ?.expression?.name;

        // if both fail, just the name of the node
        let name = firstVText ?? firstVExpressionContainer() ?? node.name;
        self.names.push(new BindingToName(id, name, node.loc));
      },
      //last node on the way to top
      "VElement[name=template]:exit"(node) {
        let tagsInfo = self.names.filter((x) => self.boundHtmlTags.has(x.id));
        let result = new TemplateBindings(self.bindings, tagsInfo);

        context.report({ node: node, message: JSON.stringify(result) });
        reset();
      },
    });
  },
};
