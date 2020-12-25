const { FunctionState, accessType } = require("../state/function-state");
const utils = require("../utils");

let state = new FunctionState();

const NAME = "function-reads-writes";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //start of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]"(
          node
        ) {
          state.newMethod(node);
        },
        //end of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]:exit"() {
          state.nodeExited();
        },
        //writes left side of assignment expression
        "Property[key.name = methods] AssignmentExpression"(node) {
          state.identifierOrExpressionNew(node.left, accessType.WRITES);
        },
        //method calls
        "Property[key.name = methods] CallExpression "(node) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.CALLS);
        },
        //declares
        "Property[key.name = methods] VariableDeclarator"(node) {
          state.identifierOrExpressionNew(node.id, accessType.DECLARES);
        },
        //all expressions
        "Property[key.name = methods] FunctionExpression :matches(MemberExpression, Identifier)"(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.ALL);
        },

        "Property[key.name = methods] ObjectExpression Property[method = false]"(
          node
        ) {
          state.identifierOrExpressionNew(node.key, accessType.OBJECT_PROPERTY);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let methods = state.finished();
          context.report({ node: node, message: JSON.stringify(methods) });
        },
      }
    );
  },
};
