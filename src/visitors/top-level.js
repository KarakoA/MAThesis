const { TopLevel } = require("../models/visitors");
const utils = require("../utils");
let self = {};
function reset() {
  self.methods = [];
  self.init = [];
  self.variables = [];
}
reset();

const NAME = "top-level";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //V - top level variables (properties within data )
        "Property[key.name = data] ReturnStatement ObjectExpression"(node) {
          let r = utils.getNamesFromTopLevelObject(node);
          console.log(r);
        },

        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let result = new TopLevel(self.variables);
          context.report({ node: node, message: JSON.stringify(result) });
        },
      }
    );
  },
};
