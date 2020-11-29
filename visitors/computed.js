const { FunctionState } = require("../function-state");
const { Init, Computed } = require("../models/visitors");
let state = new FunctionState();

const NAME = "computed";
module.exports = {
  NAME,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //start of any computed property
        "Property[key.name = computed] Property[value.type=FunctionExpression]"(
          node
        ) {
          state.newMethod(node.key.name);
        },
        //writes (this type call as the left side of an expression statement)
        "Property[key.name = computed] AssignmentExpression[left.object.type=ThisExpression]"(
          node
        ) {
          state.newWrites(node.left.property.name);
        },
        //method calls (this type call directly inside a call expression)
        "Property[key.name = computed] CallExpression[callee.object.type=ThisExpression]"(
          node
        ) {
          state.newCalls(node.callee.property.name);
        },
        //all this expressions
        "Property[key.name = computed] MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          state.newAll(node.property.name);
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"(node) {
          let computed = new Computed(state.finished());
          context.report({ node: node, message: JSON.stringify(computed) });
        },
      }
    );
  },
};
