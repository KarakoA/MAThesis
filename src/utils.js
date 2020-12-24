const {
  PropertyAccess,
  MethodAccess,
  Identifier,
  IdentifierChain,
} = require("../models/visitors");

function firstParentOfType(elem, typeString) {
  return elem.parent
    ? elem.parent.type == typeString
      ? elem.parent
      : firstParentOfType(elem.parent, typeString)
    : undefined;
}

//inside call expressions, triggered once for the call expression itself and a second time for each identifier/member chain
//TODO this triggers twice for the method name
// also for nested call expressions each time
function isRootNameNode(node) {
  return isRootCallExpression(node) && isRootName(node);
}

//TODO naming
function isRootName(node) {
  return (
    (node.type === "MemberExpression" || node.type === "Identifier") &&
    node.parent.type !== "MemberExpression"
  );
}
function isRootCallExpression(node) {
  return (
    node.type === "CallExpression" && node.parent.type !== "CallExpression"
  );
}

function isNameIdentifier(name) {
  return (
    name === "Identifier" ||
    name === "MemberExpression" ||
    name === "ThisExpression"
  );
}

function methodOrProperty(node) {
  if (node.type == "CallExpression") {
    let methodName = getNameFromExpression(node.callee);
    let args = node.arguments.map((x) => methodOrProperty(x));
    return new MethodAccess(methodName, args);
  } else if (isNameIdentifier(node.type)) {
    return new PropertyAccess(getNameFromExpression(node));
  } else throw new Error(`Unknown node type: ${node.type}`);
}

function getNameFromExpression(node, prev = []) {
  if (node.type === "Identifier")
    return new IdentifierChain(
      prev.concat(new Identifier(node.name)).reverse()
    );
  else if (node.type === "ThisExpression") {
    return new IdentifierChain(prev.concat(new Identifier("this")).reverse());
  } else if (node.type === "MemberExpression")
    return getNameFromExpression(
      node.object,
      prev.concat(new Identifier(node.property.name()))
    );
  else throw new Error(`Unknown node type: ${node.type}`);
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
  methodOrProperty,
};
