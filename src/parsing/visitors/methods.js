import {
  MethodsBuilder,
  AccessType,
  MethodType,
} from "../builders/methods-builder";
import * as utils from "../utils";

let builder = new MethodsBuilder();

export const NAME = "methods";
export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor(
    {},
    {
      //TODO more qualified for ALL access (specify back to root to ensure top level)

      //start of init
      "Property[key.name = created]"(node) {
        builder.newMethod(node, MethodType.INIT);
      },

      //start of any method
      "Property[key.name = methods] Property[value.type=FunctionExpression]"(
        node
      ) {
        builder.newMethod(node, MethodType.METHOD);
      },
      //start of computed
      "Property[key.name = computed] Property[value.type=FunctionExpression]"(
        node
      ) {
        builder.newMethod(node, MethodType.COMPUTED);
      },

      //end of any method or init
      "Property[value.type=FunctionExpression]:exit"() {
        builder.nodeExited();
      },
      //writes left side of assignment expression
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) AssignmentExpression"(
        node
      ) {
        builder.identifierOrExpressionNew(node.left, AccessType.WRITES);
      },
      //method calls
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) CallExpression "(
        node
      ) {
        // if (utils.isRootNameNode(node))
        builder.identifierOrExpressionNew(node, AccessType.CALLS);
      },
      //declares
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) VariableDeclarator"(
        node
      ) {
        builder.identifierOrExpressionNew(node.id, AccessType.DECLARES);
      },
      //all expressions
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) FunctionExpression :matches(MemberExpression, Identifier)"(
        node
      ) {
        if (utils.isRootNameNode(node))
          builder.identifierOrExpressionNew(node, AccessType.ALL);
      },
      ":matches(Property[key.name = methods], Property[key.name = created],Property[key.name = computed]) FunctionExpression Property[method = false]"(
        node
      ) {
        builder.identifierOrExpressionNew(node.key, AccessType.OBJECT_PROPERTY);
      },
      //returned back to the top of the parsing tree
      "ExportDefaultDeclaration:exit"(node) {
        const result = builder.build();
        const json = JSON.stringify(result);
        context.report({ node: node, message: json });
      },
    }
  );
}
