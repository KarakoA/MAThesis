import { Method, Property, EntityType, Entity } from "./models/shared";

import _ from "lodash/fp";
import {
  Identifier,
  nextIndex,
  IdentifierType,
  ThisInstance,
  prevIndex,
} from "../common/models/identifier";
import { create, Identifiers } from "../common/models/identifiers";
import { AST } from "vue-eslint-parser";
import { AST_NODE_TYPES } from "@typescript-eslint/types";

import { assert } from "console";

//reexport eslint ast and node types
export { AST_NODE_TYPES, AST };

//#region type alias definitions
export type SupportedNamedExpression =
  | AST.ESLintIdentifier
  | AST.ESLintThisExpression
  | AST.ESLintMemberExpression;

//user defined type guard
function isSupportedNameExpression(
  arg: AST.ESLintNode
): arg is SupportedNamedExpression {
  const types = [
    AST_NODE_TYPES.Identifier,
    AST_NODE_TYPES.ThisExpression,
    AST_NODE_TYPES.MemberExpression,
  ];
  return types.includes(arg.type as AST_NODE_TYPES);
}

export type SupportedTopLevelExpression =
  | AST.ESLintObjectExpression
  | AST.ESLintProperty
  | AST.ESLintMemberExpression;

//user defined type guard
function isSupportedTopLevelExpression(
  arg: AST.ESLintNode
): arg is SupportedNamedExpression {
  const types = [
    AST_NODE_TYPES.ObjectExpression,
    AST_NODE_TYPES.Property,
    AST_NODE_TYPES.MemberExpression,
  ];
  return types.includes(arg.type as AST_NODE_TYPES);
}
//#endregion

//#region Node infos

//inside call expressions, triggered once for the call expression itself and a second time for each identifier/member chain
//TODO this triggers twice for the method name
// also for nested call expressions each time
export function isRootNameNode(node: AST.ESLintExpression): boolean {
  return isRootCallExpression(node) || isRootName(node);
}

//TODO naming
//TODO  use SupportedNamedExpression here
export function isRootName(node: AST.ESLintExpression): boolean {
  return (
    isSupportedNameExpression(node) &&
    node.parent?.type !== AST_NODE_TYPES.MemberExpression
  );
}
export function isRootCallExpression(node: AST.ESLintExpression): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.parent?.type !== AST_NODE_TYPES.CallExpression
  );
}

//#endregion
//#region First parent
export function firstParentOfType(
  elem: AST.Node,
  type: string
): undefined | AST.Node {
  return elem.parent
    ? elem.parent.type === type
      ? elem.parent
      : firstParentOfType(elem.parent, type)
    : undefined;
}
//#endregion

//#region Id
/**
 * Computes an id for a VElement node (html tag)
 * @param element VElement
 */
export function id(element: AST.VElement): string {
  const locId =
    element.loc.start.line +
    "_" +
    element.loc.start.column +
    "_" +
    element.loc.end.line +
    "_" +
    element.loc.end.column;
  return `${element.name}_${locId}`;
}
//#endregion

//#region Extraction
/**
 * Extracts identifiers the given named expression
 * @param node
 */
export function identifiers(node: SupportedNamedExpression): Identifiers {
  return getNameFromExpression(node);
}

/**
 * Extracts a property from the given named expression
 * @param node
 */
export function property(node: SupportedNamedExpression): Property {
  return {
    id: getNameFromExpression(node),
    discriminator: EntityType.PROPERTY,
  };
}
/**
 * Extracts a method from the given call expression
 * @param node
 */
export function method(node: AST.ESLintCallExpression): Method {
  const methodName = getNameFromESLintExpression(
    node.callee as AST.ESLintExpression
  );
  const args = resolveArgs(node.arguments);
  return {
    id: methodName,
    args,
    discriminator: EntityType.METHOD,
  };
}

/**
 * Extracts the first VFor expression of the given node or returns undefined if there is none.
 * @param node html tag
 */
export function vForExpression(
  node: AST.VElement
): AST.VForExpression | undefined {
  const maybeVFor = node.startTag.attributes?.find(
    (x) => (x.key.name as AST.VIdentifier)?.name === "for"
  );
  return (maybeVFor?.value as AST.VExpressionContainer)
    ?.expression as AST.VForExpression;
}

//#endregion

//#region Top Level Object Extraction
export function IdentifiersFromTopLevelObject(
  node: AST.ESLintObjectExpression
): Identifiers[] {
  function func(
    node: SupportedTopLevelExpression,
    prev: Identifier[]
  ): Identifiers[] {
    switch (node.type) {
      case AST_NODE_TYPES.Property: {
        assert(node.key.type === AST_NODE_TYPES.Identifier);
        const name = (node.key as AST.ESLintIdentifier).name;
        const value = node.value;
        switch (value.type) {
          case AST_NODE_TYPES.ObjectExpression:
            assert(isSupportedTopLevelExpression(node.value));
            return func(
              node.value as SupportedTopLevelExpression,
              prev.concat({
                name,
                discriminator: IdentifierType.NAME_IDENTIFIER,
              })
            );
          //@Future array type distinguish here
          case AST_NODE_TYPES.ArrayExpression:
            return [
              create(...prev, {
                name,
                discriminator: IdentifierType.NAME_IDENTIFIER,
              }),
            ];
          //@Future other type distinguish here
          default:
            return [
              create(...prev, {
                name,
                discriminator: IdentifierType.NAME_IDENTIFIER,
              }),
            ];
        }
      }
      case AST_NODE_TYPES.ObjectExpression:
        assert(
          _.all(
            (x) => isSupportedTopLevelExpression(x as AST.ESLintNode),
            node.properties
          )
        );
        //TODO might need _.flattenDeep here
        return _.flatten(
          node.properties.map((x) =>
            func(x as SupportedTopLevelExpression, prev)
          )
        );
      case AST_NODE_TYPES.MemberExpression:
        //should never be the case for top level data object
        return [getNameFromExpression(node)];
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }
  return func(node, []);
}

//#endregion

//#region  Helper Methods
function resolveArgs(
  nodes: (AST.ESLintExpression | AST.ESLintSpreadElement)[]
): Array<Entity> {
  if (_.some((x) => x.type === AST_NODE_TYPES.SpreadElement, nodes))
    throw new Error("SpreadElements are not supported!");
  const nodesTyped = nodes.map((x) => x as AST.ESLintExpression);
  return _.flatMap(resolveArg, nodesTyped);
}
//TODO if dropping binary alltogether (or trying to resolve to one branch) could become Entity
function resolveArg(node: AST.ESLintExpression): Array<Entity> {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    return [method(node)];
  } else if (node.type === AST_NODE_TYPES.BinaryExpression) {
    const left = resolveArg(node.left);
    const right = resolveArg(node.right);
    return [...left, ...right];
  } else if (node.type === AST_NODE_TYPES.Literal) {
    return [];
  } else if (isSupportedNameExpression(node)) {
    return [property(node)];
  } else throw new Error(`Unsupported node type: ${node.type}`);
}

function getNameFromESLintExpression(node: AST.ESLintExpression): Identifiers {
  if (!isSupportedNameExpression(node))
    throw new Error(`Unsupported node type ${node.type} for name!`);
  return getNameFromExpression(node);
}

/**
 * Extracts identifirs from a name expression node
 * @param node
 */
function getNameFromExpression(
  node: SupportedNamedExpression,
  prev: Identifier[] = []
): Identifiers {
  function inner(
    node: SupportedNamedExpression,
    prev: Identifier[] = []
  ): Identifiers {
    switch (node?.type) {
      case AST_NODE_TYPES.Identifier: {
        return inner(
          node.parent as SupportedNamedExpression,
          prev.concat({
            name: node.name,
            discriminator: IdentifierType.NAME_IDENTIFIER,
          })
        );
      }
      case AST_NODE_TYPES.ThisExpression: {
        return inner(
          node.parent as SupportedNamedExpression,
          prev.concat(ThisInstance)
        );
      }

      case AST_NODE_TYPES.MemberExpression: {
        let next: Identifier;
        //index accessor (i.e. X[Z] or X[1] or X[Z+1+y])
        if (node.computed) {
          //X[Z] => 'i',X[1] => 1, X[Z+1+y] => 'i' or 'j' if prev is 'i' etc.
          next =
            node.property.type === AST_NODE_TYPES.Literal &&
            node.property.value !== null
              ? {
                  name: node.property.value.toString(),
                  discriminator: IdentifierType.NUMERIC_INDEX,
                }
              : nextIndex(_.last(prev));
        } else {
          if ("name" in node.property)
            next = {
              name: node.property.name,
              discriminator: IdentifierType.NAME_IDENTIFIER,
            };
          else
            throw new Error(
              `node.property of type ${node.property.type} does not have a name.`
            );
        }
        return inner(
          node.parent as SupportedNamedExpression,
          prev.concat(next)
        );
      }
      default:
        //not a supported one, finished
        return create(...prev);
    }
  }

  function toBottom(node: AST.Node): SupportedNamedExpression {
    if (node.type !== "MemberExpression")
      return node as SupportedNamedExpression;
    else return toBottom((node as AST.ESLintMemberExpression).object);
  }
  const memberExpr = toBottom(node);
  return inner(memberExpr, prev);
}

//#endregion
