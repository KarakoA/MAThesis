import { Method, Property, EntityType, Entity } from "./models/shared";

import _ from "lodash/fp";
import {
  This,
  Identifier,
  nextIndex,
  IdentifierType,
} from "../models2/identifier";
import { create, Identifiers } from "../models2/identifiers";
import { AST } from "vue-eslint-parser";

import { AST_NODE_TYPES } from "@typescript-eslint/types";

import { assert } from "console";

export { AST_NODE_TYPES, AST };
export function vForExpression(
  node: AST.VElement
): AST.VForExpression | undefined {
  const maybeVFor = node.startTag.attributes?.find(
    (x) => (x.key.name as AST.VIdentifier)?.name === "for"
  );
  return (maybeVFor?.value as AST.VExpressionContainer)
    ?.expression as AST.VForExpression;
}

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
    (node.type === AST_NODE_TYPES.MemberExpression ||
      node.type === AST_NODE_TYPES.Identifier) &&
    node.parent?.type !== AST_NODE_TYPES.MemberExpression
  );
}
export function isRootCallExpression(node: AST.ESLintExpression): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.parent?.type !== AST_NODE_TYPES.CallExpression
  );
}

export function property(node: SupportedNamedExpression): Property {
  return {
    id: getNameFromExpression(node),
    discriminator: EntityType.PROPERTY,
  };
}

export function method(node: AST.ESLintCallExpression): Method {
  const methodName = determineName(node.callee as AST.ESLintExpression);
  const args = resolveArgs(node.arguments);
  return {
    id: methodName,
    args,
    discriminator: EntityType.METHOD,
  };
}
function determineName(node: AST.ESLintExpression): Identifiers {
  if (!isSupportedNameExpression(node))
    throw new Error(`Unsupported node type ${node.type} for name!`);
  return getNameFromExpression(node);
}

function resolveArgs(nodes: any[]): Array<Entity> {
  //@unsafe
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

//ObjectExpression
//[Property]
//.key (identifier always)
//.value (back to top or )
//.value actually expression
export function getNamesFromTopLevelObject(
  node: AST.ESLintObjectExpression
): Identifiers[] {
  function func(
    node: SupportedTopLevelExpression,
    prev: Identifier[]
  ): Identifiers[] {
    switch (node.type) {
      case AST_NODE_TYPES.Property: {
        //assert node.key.type is identifier
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

export type SupportedNamedExpression =
  //| AST.ESLintLiteral
  AST.ESLintIdentifier | AST.ESLintThisExpression | AST.ESLintMemberExpression;

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

export function getNameFromExpression(
  node: SupportedNamedExpression,
  prev: Identifier[] = []
): Identifiers {
  switch (node.type) {
    case AST_NODE_TYPES.Identifier: {
      const ids = prev.concat({
        name: node.name,
        discriminator: IdentifierType.NAME_IDENTIFIER,
      });
      return create(...ids.reverse());
    }
    case AST_NODE_TYPES.ThisExpression: {
      const ids = prev.concat(This);
      return create(...ids.reverse());
    }

    case AST_NODE_TYPES.MemberExpression: {
      let next: Identifier;
      //index accessor (i.e. X[Z] or X[1] or X[Z+1+y])
      if (node.computed) {
        //X[Z] => 'i',X[1] => 1, X[Z+1+y] => 'i' or 'j' if prev is 'i' etc.
        next =
          node.property.type === AST_NODE_TYPES.Literal
            ? {
                //@unsafe
                name: node.property.value as string,
                discriminator: IdentifierType.NUMERIC_INDEX,
              }
            : nextIndex(_.head(prev));
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
      assert(isSupportedNameExpression(node.object));
      return getNameFromExpression(
        node.object as SupportedNamedExpression,
        prev.concat(next)
      );
    }
    default:
      throw new Error(`Unknown node type: ${node.type}. prev: ${prev}`);
  }
}

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
