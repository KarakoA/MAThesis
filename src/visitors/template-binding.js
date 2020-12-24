const { BindingsState } = require("../state/bindings-state.js");

const { bindingType } = require("../models/visitors.js");

let state = new BindingsState();
let utils = require("../utils");
const NAME = "template-binding";

module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      // click handlers
      "VAttribute[key.name.name=on] >  VExpressionContainer :matches(MemberExpression, Identifier,CallExpression)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingType.EVENT);
      },

      //two way binding
      "VAttribute[key.name.name=model] > VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingType.TWO_WAY);
      },

      //other identifiers
      ":not(:matches(VAttribute[key.name.name=on], VAttribute[key.name.name=model])) >  VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, bindingType.ONE_WAY);
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
