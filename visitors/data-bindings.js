let utils = require("../utils")

module.exports = {
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      VElement(node) {
        console.log("ASDGF");
        console.log(utils.id(node))
        console.log(node.type);
        console.log(node.range);
        console.log("DONE");
        context.report({
          node: node,
          message: "Unexpected identifier",
        });
        //...
      },
      VText(node) {
        //console.log("ASDGF")
        console.log(node.value);
        console.log(node.loc);
        //  console.log(node.value)
      },
    });
  },
};