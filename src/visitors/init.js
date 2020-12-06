const { FunctionState } = require("../state/function-state");
const { Init } = require("../models/visitors");
let state = new FunctionState();
//set the name
state.newMethod("init");

const NAME = "init";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //writes (this type call as the left side of an expression statement)
        "Property[key.name = created] AssignmentExpression[left.object.type=ThisExpression]"(
          node
        ) {
          state.newWrites(node.left.property.name);
        },
        //method calls (this type call directly inside a call expression)
        "Property[key.name = created] CallExpression[callee.object.type=ThisExpression]"(
          node
        ) {
          state.newCalls(node.callee.property.name);
        },
        //all this expressions
        "Property[key.name = created] MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          state.newAll(node.property.name);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let methods = new Init(state.finished());
          context.report({ node: node, message: JSON.stringify(methods) });
        },
      }
    );
  },
};
