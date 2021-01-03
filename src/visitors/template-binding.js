import { BindingsState } from "../state/bindings-state.js";

import { bindingType } from "../models/visitors.js";
import * as utils from "../utils.js";

let state = new BindingsState();
export const NAME = "template-binding";

export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor({
    // click handlers
    "VAttribute[key.name.name=on] >  VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      //TODO assumes click handlers are always methods(call expressions, might not be the case, should only filter out args)
      if (utils.isRootCallExpression(node))
        state.identifierOrExpressionNew(node, bindingType.EVENT);
    },

    //two way binding
    "VAttribute[key.name.name=model] > VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      if (utils.isRootNameNode(node))
        state.identifierOrExpressionNew(node, bindingType.TWO_WAY);
    },

    //other identifiers
    //TODO handle vfor, has VAttribute[key.argument.name=key]
    //for itself VAttribute[key.name.name=for]
    ":not(:matches(VAttribute[key.name.name=on], VAttribute[key.name.name=model]),VAttribute[key.argument.name=key], VAttribute[key.name.name=for]) >  VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      if (utils.isRootNameNode(node))
        state.identifierOrExpressionNew(node, bindingType.ONE_WAY);
    },

    // all html tags
    VElement(node) {
      let vFor = utils.vForExpression(node);
      if (vFor) state.elementWithVForStarted(vFor);
    },
    // all html tags
    "VElement:exit"(node) {
      state.nodeExited(node);
      let vFor = utils.vForExpression(node);
      if (vFor) state.elementWithVForExited();
    },
    //last node on the way to top
    "VElement[name=template]:exit"(node) {
      let result = state.finish();

      context.report({ node: node, message: JSON.stringify(result) });
      state.reset();
    },
  });
}
