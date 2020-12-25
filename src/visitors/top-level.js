const utils = require("../utils");

const NAME = "top-level";
module.exports = {
  NAME,
  create(context) {
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
  },
};
