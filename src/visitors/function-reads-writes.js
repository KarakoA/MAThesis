const { FunctionState } = require("../function-state");

let state = new FunctionState();

const NAME = "function-reads-writes";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //start of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]"(
          node
        ) {
          state.newMethod(node.key.name);
        },
        //writes (this type call as the left side of an expression statement)
        "Property[key.name = methods] AssignmentExpression[left.object.type=ThisExpression]"(
          node
        ) {
          state.newWrites(node.left.property.name);
        },
        //method calls (this type call directly inside a call expression)
        "Property[key.name = methods] CallExpression[callee.object.type=ThisExpression]"(
          node
        ) {
          state.newCalls(node.callee.property.name);
        },
        //all this expressions
        "Property[key.name = methods] MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          state.newAll(node.property.name);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let methods = state.finished();
          context.report({ node: node, message: JSON.stringify(methods) });
        },
      }
    );
  },
};
