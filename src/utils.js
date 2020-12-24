const {
  PropertyAccess,
  MethodAccess,
  Identifier,
  IdentifierChain,
} = require("./models/visitors.js");

function nextChar(i) {
  console.log(i);
  return String.fromCharCode(i.charCodeAt() + 1);
}
function firstParentOfType(elem, typeString) {
  return elem.parent
    ? elem.parent.type == typeString
      ? elem.parent
      : firstParentOfType(elem.parent, typeString)
    : undefined;
}

function vForExpression(node) {
  let vFor = node.startTag.attributes?.find((x) => x.key?.name?.name === "for");
  return vFor ? vFor.value.expression : undefined;
}

//inside call expressions, triggered once for the call expression itself and a second time for each identifier/member chain
//TODO this triggers twice for the method name
// also for nested call expressions each time
function isRootNameNode(node) {
  return isRootCallExpression(node) || isRootName(node);
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

function getNameFromExpression(node, prev = [], position = undefined) {
  if (node.type === "Identifier")
    return new IdentifierChain(
      prev.concat(new Identifier(node.name, position)).reverse()
    );
  else if (node.type === "ThisExpression") {
    return new IdentifierChain(prev.concat(new Identifier("this")).reverse());
  } else if (node.type === "MemberExpression") {
    //index accessor
    if (node.computed) {
      let position =
        node.property.type === "Literal" ? node.property.value : "i";
      return getNameFromExpression(node.object, prev, position);
    } else
      return getNameFromExpression(
        node.object,
        prev.concat(new Identifier(node.property.name, position))
      );
  } else throw new Error(`Unknown node type: ${node.type}. prev: ${prev}`);
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
  vForExpression,
};
