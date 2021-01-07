import * as utils from "../utils";
import { AST } from "vue-eslint-parser";

export const NAME = "top-level-variables";

//TODO can this be even found? has .ts
//: AST.VElement
export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor(
    {},
    {
      //V - top level variables (properties within data )
      "Property[key.name = data]  ReturnStatement > ObjectExpression"(
        node: AST.VElement
      ) {
        const result = { topLevelData: utils.getNamesFromTopLevelObject(node) };
        context.report({ node: node, message: JSON.stringify(result) });
      },
    }
  );
}
