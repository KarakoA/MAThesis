const { BindingsState, bindingTypes } = require("../state/bindings-state.js");

let state = new BindingsState();

const NAME = "template-binding";

function name(node) {
  return node.type === "Identifier" ? node.name : node.property.name;
}
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      // click handlers
      "VAttribute[key.name.name=on] >  VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        state.identifierOrExpressionNew(name(node), bindingTypes.CLICK_HANDLER);
      },

      //two way binding
      "VAttribute[key.name.name=model] > VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        state.identifierOrExpressionNew(name(node), bindingTypes.TWO_WAY);
      },
      //other identifiers
      ":not(:matches(VAttribute[key.name.name=on], VAttribute[key.name.name=model])) >  VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        state.identifierOrExpressionNew(name(node), bindingTypes.ONE_WAY);
      },

      "VExpressionContainer :matches(MemberExpression, Identifier):exit"() {
        state.identifierOrExpressionExit();
      },

      // all html tags
      "VElement:exit"(node) {
        state.nodeExited(node);
      },
      //last node on the way to top
      "VElement[name=template]:exit"(node) {
        let result = state.finish();

        context.report({ node: node, message: JSON.stringify(result) });
        state.reset();
      },
    });
  },
};
