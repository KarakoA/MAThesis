import { TopLevelVariablesBuilder } from "../builders/top-level-builder";

export const NAME = "top-level-variables";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor(
    {},
    {
      //V - top level variables (properties within data )
      "Property[key.name = data]  ReturnStatement > ObjectExpression"(node) {
        const result = new TopLevelVariablesBuilder().build(node);
        const json = JSON.stringify(result);
        context.report({ node: node, message: json });
      },
    }
  );
}
