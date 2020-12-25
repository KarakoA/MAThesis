const {
  PropertyAccess,
  MethodAccess,
  Identifier,
  IdentifierChain,
  TopLevelVariable,
} = require("./models/visitors.js");

const { flattenDeep } = require("lodash");

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

//TODO handle binary expressions
//TODO not so nice abstraction
function methodOrProperty(node) {
  if (node.type === "CallExpression") {
    let methodName = getNameFromExpression(node.callee);
    let args = node.arguments.map((x) => methodOrProperty(x)).flat();
    return new MethodAccess(methodName, args);
  } else if (node.type === "BinaryExpression") {
    let left = methodOrProperty(node.left);
    let right = methodOrProperty(node.right);
    return [left, right];
  } else if (node.type === "Literal") {
    return [];
  } else if (isNameIdentifier(node.type)) {
    return new PropertyAccess(getNameFromExpression(node));
  } else throw new Error(`Unknown node type: ${node.type}`);
}

//ObjectExpression
//[Property]
//.key (identifier always)
//.value (back to top or )
//.value actually expression
function getNamesFromTopLevelObject(node) {
  function func(node, prev) {
    switch (node.type) {
      case "Property": {
        let name = node.key.name;
        let value = node.value;
        if (value.type === "ObjectExpression")
          return func(node.value, prev.concat(new Identifier(name)));
        //@Future array type distinguish here
        else if (value.type === "ArrayExpression")
          //TODO encapsulate this logic in ctor's
          return new TopLevelVariable(
            new IdentifierChain(prev.concat(new Identifier(name)))
          );
        //@Future other type distinguish here
        else
          return new TopLevelVariable(
            new IdentifierChain(prev.concat(new Identifier(name)))
          );
      }
      case "ObjectExpression":
        return node.properties.map((x) => func(x, prev));
      case "MemberExpression":
        //should never be the case for top level data object
        return [getNameFromExpression(node)];
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
  return flattenDeep(func(node, []));
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
  getNamesFromTopLevelObject,
};
