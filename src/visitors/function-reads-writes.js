const {
  FunctionState,
  accessType,
  methodType,
} = require("../state/function-state");
const utils = require("../utils");

let state = new FunctionState();

const NAME = "function-reads-writes";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //TODO more qualified for ALL access (specify back to root to ensure top level)

        //start of init
        "Property[key.name = created]"(node) {
          state.newMethod(node, methodType.INIT);
        },

        //start of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]"(
          node
        ) {
          state.newMethod(node, methodType.METHOD);
        },

        //end of any method or init
        "Property[value.type=FunctionExpression]:exit"() {
          state.nodeExited();
        },
        //writes left side of assignment expression
        ":matches(Property[key.name = methods], Property[key.name = created]) AssignmentExpression"(
          node
        ) {
          state.identifierOrExpressionNew(node.left, accessType.WRITES);
        },
        //method calls
        ":matches(Property[key.name = methods], Property[key.name = created]) CallExpression "(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.CALLS);
        },
        //declares
        ":matches(Property[key.name = methods], Property[key.name = created]) VariableDeclarator"(
          node
        ) {
          state.identifierOrExpressionNew(node.id, accessType.DECLARES);
        },
        //all expressions
        ":matches(Property[key.name = methods], Property[key.name = created]) FunctionExpression :matches(MemberExpression, Identifier)"(
          node
        ) {
          if (utils.isRootNameNode(node))
            state.identifierOrExpressionNew(node, accessType.ALL);
        },

        ":matches(Property[key.name = methods], Property[key.name = created]) ObjectExpression Property[method = false]"(
          node
        ) {
          state.identifierOrExpressionNew(node.key, accessType.OBJECT_PROPERTY);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let methods = state.finished();
          console.log(methods);
          context.report({ node: node, message: JSON.stringify(methods) });
        },
      }
    );
  },
};
