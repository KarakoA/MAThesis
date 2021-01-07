import { BindingsBuilder } from "../builders/bindings-builder";

import { BindingType } from "../models/template-bindings";
import * as utils from "../utils";

let builder = new BindingsBuilder();
export const NAME = "template-bindings";

export function create(context) {
  return context.parserServices.defineTemplateBodyVisitor({
    // click handlers
    "VAttribute[key.name.name=on] >  VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      //TODO assumes click handlers are always methods(call expressions, might not be the case, should only filter out args)
      if (utils.isRootCallExpression(node))
        builder.identifierOrExpressionNew(node, BindingType.EVENT);
    },

    //two way binding
    "VAttribute[key.name.name=model] > VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      if (utils.isRootNameNode(node))
        builder.identifierOrExpressionNew(node, BindingType.TWO_WAY);
    },

    //other identifiers
    //TODO handle vfor, has VAttribute[key.argument.name=key]
    //for itself VAttribute[key.name.name=for]
    ":not(:matches(VAttribute[key.name.name=on], VAttribute[key.name.name=model]),VAttribute[key.argument.name=key], VAttribute[key.name.name=for]) >  VExpressionContainer :matches(MemberExpression, Identifier, CallExpression)"(
      node
    ) {
      if (utils.isRootNameNode(node))
        builder.identifierOrExpressionNew(node, BindingType.ONE_WAY);
    },

    // all html tags
    VElement(node) {
      let vFor = utils.vForExpression(node);
      if (vFor) builder.elementWithVForStarted(vFor);
    },
    // all html tags
    "VElement:exit"(node) {
      builder.nodeExited(node);
      let vFor = utils.vForExpression(node);
      if (vFor) builder.elementWithVForExited();
    },
    //last node on the way to top
    "VElement[name=template]:exit"(node) {
      let result = builder.build();

      context.report({ node: node, message: JSON.stringify(result) });
      builder.reset();
    },
  });
}
