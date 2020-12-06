const { BindingsState, bindingTypes } = require("../state/bindings-state.js");

let state = new BindingsState();
let utils = require("../utils");
const NAME = "template-binding";

module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      // click handlers
      "VAttribute[key.name.name=on] >  VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingTypes.CLICK_HANDLER);
      },

      //two way binding
      "VAttribute[key.name.name=model] > VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingTypes.TWO_WAY);
      },
      //other identifiers
      ":not(:matches(VAttribute[key.name.name=on], VAttribute[key.name.name=model])) >  VExpressionContainer :matches(MemberExpression, Identifier)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingTypes.ONE_WAY);
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
