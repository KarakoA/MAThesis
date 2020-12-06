function firstParentOfType(elem, typeString) {
  return elem.parent
    ? elem.parent.type == typeString
      ? elem.parent
      : firstParentOfType(elem.parent, typeString)
    : undefined;
}

function isRootNameNode(node) {
  return node.parent.type !== "MemberExpression";
}

function getNameFromExpression(node, prev = []) {
  if (node.type === "Identifier")
    return prev.concat(node.name).reverse().join(".");
  else if (node.type === "MemberExpression") {
    return getNameFromExpression(node.object, prev.concat(node.property.name));
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
  getNameFromExpression,
  isRootNameNode,
};
