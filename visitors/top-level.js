const { TopLevel } = require("../models/visitors");

let methods = [];
let init = [];
let variables = [];

const NAME = "top-level"
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //V - top level variables (properties within data )
        "Property[key.name = data] Property"(node) {
          //does not supported nested ones a:{b:c} would be equal to a:, b:
          variables.push(node.key.name);
        },

        //F - top level methods (start of any method within methods)
        "Property[key.name = methods] Property[value.type=FunctionExpression]"(
          node
        ) {
          methods.push(node.key.name);
        },

        //init - (this type call directly inside a call expression)
        //TODO proper init, not only methods inside it
        "Property[key.name = created] CallExpression[callee.type=MemberExpression] > MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          init.push(node.property.name);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let result = new TopLevel(variables, methods, init);
          context.report({ node: node, message: JSON.stringify(result) });
        },
      }
    );
  },
};
