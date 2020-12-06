function firstParentOfType(elem, typeString) {
  return elem.parent
    ? elem.parent.type == typeString
      ? elem.parent
      : firstParentOfType(elem.parent, typeString)
    : undefined;
}

function getBindingNameFromExpressionContainer(expressionNode) {
  let node = expressionNode?.expression;
  return node ? getBindingNameFromMemberExpression(node) : undefined;
}

function getBindingNameFromMemberExpression(node, prev = []) {
  if (node.type === "Identifier")
    return prev.concat(node.name).reverse().join(".");
  else if (node.type === "MemberExpression") {
    return getBindingNameFromMemberExpression(
      node.object,
      prev.concat(node.property.name)
    );
  } else throw new Error(`Unknown node type: ${node.type}`);
}

function firstVElementParent(elem) {
  return firstParentOfType(elem, "VElement");
}

function id(element) {
  let locId =
    element.loc.start.line +
    "_" +
    element.loc.start.column +
    "_" +
    element.loc.end.line +
    "_" +
    element.loc.end.column;
  return `${element.name}_${locId}`;
}

module.exports = {
  id,
  firstParentOfType,
  firstVElementParent,
  getBindingNameFromExpressionContainer,
};
