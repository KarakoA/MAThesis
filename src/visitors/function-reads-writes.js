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
          state.newMethod(node.key.name);
        },
        //end of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]:exit"() {
          state.nodeExited();
        },
        //writes (this type call as the left side of an expression statement)
        "Property[key.name = methods] AssignmentExpression :matches(MemberExpression, Identifier)"(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.WRITES);
        },
        //method calls (this type call directly inside a call expression)
        "Property[key.name = methods] CallExpression :matches(MemberExpression, Identifier)"(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.CALLS);
        },
        //declares
        "Property[key.name = methods] VariableDeclarator"(node) {
          state.identifierOrExpressionNew(node.id, accessType.DECLARES);
        },
        //all this expressions
        "Property[key.name = methods] FunctionExpression :matches(MemberExpression, Identifier)"(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.ALL);
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
