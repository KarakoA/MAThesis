let utils = require("../utils");
//TODO delete me, logging not crampled 
require('util').inspect.defaultOptions.depth = null

const bindingType = {
  ONE_WAY: "bind",
  TWO_WAY: "model",
  MOUSTACHE: "moustache",
  OTHER: "other",
};
//TODO correct way to store
let bindings = [];
let currentId = undefined;
let currentBinding = bindingType.MOUSTACHE;
module.exports = {
  bindings,
  create(context) {
    return context.parserServices.defineTemplateBodyVisitor({
      VEndTag() {
        //just print for now
        console.log(bindings);
      },
      //new html tag, set target to its id
      VElement(elem) {
        currentId = utils.id(elem);
      },
      //inside an attribute
      VAttribute(elem) {
        let key = elem.key.name.name;
        //support only v-bind and model for now
        switch (key) {
          case "bind":
            currentBinding = bindingType.ONE_WAY;
            break;
          case "model":
            currentBinding = bindingType.ONE_WAY;
            break;
          default:
            currentBinding = bindingType.OTHER;
        }
      },

      //container of a vue expression (left-hand side)
      VExpressionContainer(exprContainer) {
        //null, just skip it
        let expr = exprContainer.expression;
        let { start, end } = expr.loc;
        if (!expr) return;

        let source = undefined;
        switch (expr.type) {
          case "Identifier":
            source = expr.name;
            break;
          //later add support for other types here, MemberIdentifier etc ...

          //unknown
          default:
            return;
        }
        //consume
        if (currentBinding !== bindingType.OTHER) {
          //if supported type, include
          bindings.push({
            source: source,
            target: currentId,
            location: {start, end},
          });
        }
        currentBinding = bindingType.MOUSTACHE;
      },
    });
  },
};