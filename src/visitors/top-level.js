import * as utils from "../utils.js";

export const NAME = "top-level";

export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor(
    {},
    {
      //V - top level variables (properties within data )
      "Property[key.name = data]  ReturnStatement > ObjectExpression"(node) {
        let result = { topLevelData: utils.getNamesFromTopLevelObject(node) };
        context.report({ node: node, message: JSON.stringify(result) });
      },
    }
  );
}
