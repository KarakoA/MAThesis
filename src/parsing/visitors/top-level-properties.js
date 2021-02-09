import { TopLevelPropertiesBuilder } from "../builders/top-level-builder";

export const NAME = "top-level-properties";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor(
    {},
    {
      //V - top level properties (properties within data )
      "ExportDefaultDeclaration > ObjectExpression > Property[key.name = data]  ReturnStatement > ObjectExpression"(node) {
        const result = new TopLevelPropertiesBuilder().build(node);
        const json = JSON.stringify(result);
        context.report({ node: node, message: json });
      },
    }
  );
}
