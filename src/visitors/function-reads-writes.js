import { FunctionState, accessType, methodType } from "../state/function-state";
import * as utils from "../utils";

let state = new FunctionState();

export const NAME = "function-reads-writes";
export function create(context) {
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
      //start of computed
      "Property[key.name = computed] Property[value.type=FunctionExpression]"(
        node
      ) {
        state.newMethod(node, methodType.COMPUTED);
      },

      //end of any method or init
      "Property[value.type=FunctionExpression]:exit"() {
        state.nodeExited();
      },
      //writes left side of assignment expression
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) AssignmentExpression"(
        node
      ) {
        state.identifierOrExpressionNew(node.left, accessType.WRITES);
      },
      //method calls
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) CallExpression "(
        node
      ) {
        // if (utils.isRootNameNode(node))
        state.identifierOrExpressionNew(node, accessType.CALLS);
      },
      //declares
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) VariableDeclarator"(
        node
      ) {
        state.identifierOrExpressionNew(node.id, accessType.DECLARES);
      },
      //all expressions
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) FunctionExpression :matches(MemberExpression, Identifier)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          state.identifierOrExpressionNew(node, accessType.ALL);
      },
      //:not(:matches(Property[method = true],Property[computed = true]))
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) FunctionExpression Property[method = false]"(
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
}
