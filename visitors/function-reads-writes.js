const { assert } = require("console");

//TODO delete me, logging not crampled
require("util").inspect.defaultOptions.depth = null;

let methodName = undefined;
let writes = [];
let all = [];
let calls = [];

module.exports = {
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor(
      {},
      {
        //start of any method
        "Property[key.name = methods] Property[value.type=FunctionExpression]"(
          node
        ) {
          methodName = node.key.name;
        },
        //writes (this type call as the left side of an expression statement)
        "Property[key.name = methods] AssignmentExpression[left.object.type=ThisExpression]"(
          node
        ) {
          writes.push({
            method: methodName,
            property: node.left.property.name,
          });
        },
        //method calls (this type call directly inside a call expression)
        "Property[key.name = methods] CallExpression[callee.type=MemberExpression] > MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          calls.push({ method: methodName, property: node.property.name });
        },
        //all calls
        "Property[key.name = methods] MemberExpression[object.type=ThisExpression]"(
          node
        ) {
          all.push({ method: methodName, property: node.property.name });
        },
        //returned back to the top of the parsing tree
        "ExportDefaultDeclaration:exit"() {
          // reads equalts to  all except write and calls
          let reads = [...all]
          writes.concat(calls).forEach((el) => {
            let found = reads.find(
              (x) => x.method === el.method && x.property == el.property
            );
            let i = reads.indexOf(found);
            //i should always be found
            assert(i != -1)
            reads.splice(i, 1);
          });

          console.log({writes,reads,calls});
        },
      }
    );
  },
};
