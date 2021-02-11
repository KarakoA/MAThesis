import * as utils from "../utils";
import { AST, AST_NODE_TYPES } from "../utils";
import {
  BindingsResult,
  BindingType,
  BindingValue,
  Tag,
  Binding,
} from "../models/template-bindings";
import {
  Identifiers,
  addIndex,
  render,
  replaceFront,
  fixGenericIndices,
} from "../../common/models/identifiers";
import _ from "lodash/fp";
import { EntityType, isMethod, isProperty, method } from "../models/shared";

export function determineNodeName(
  node: AST.VElement,
  firstBindingName: string
): string {
  //simple name, raw string
  const firstVText = node.children.find(
    (x) => x.type === "VText" && x.value.trim()
  ) as AST.VText;
  // if both fail, just the name of the node
  const name = firstVText?.value.trim() ?? firstBindingName;
  return name;
}

/**
 * Methods get parsed twice - once as properties and a second time as methods.
 * Exclude all properties matching those ids
 * @param latest latest bindings
 */
function filterOutMethodNamesAsIdentifiers(
  latest: BindingValue[]
): BindingValue[] {
  //all id's of methods
  const methodNames = latest
    .filter((x) => isMethod(x.item))
    .map((x) => x.item.id);

  const inNames = (x: Identifiers) => _.some(_.isEqual(x), methodNames);
  //remove all properties, which are also in names
  return latest.filter((x) => !(isProperty(x.item) && inNames(x.item.id)));
}

function substituteVFor(
  replacements: { left: Identifiers; right: Identifiers }[],
  data: BindingValue[]
) {
  replacements.forEach((replacement) => {
    data.forEach((x) => {
      x.item.id = fixGenericIndices(
        replaceFront(x.item.id, replacement.left, replacement.right)
      );
      //Nested methods as args not supported. If supported, here recursive
      if (isMethod(x.item))
        x.item.args = x.item.args?.map((arg) => {
          return isProperty(arg)
            ? {
                id: fixGenericIndices(
                  replaceFront(arg.id, replacement.left, replacement.right)
                ),
                discriminator: EntityType.PROPERTY,
              }
            : arg;
        });
    });
  });
}

export class BindingsBuilder {
  bindings!: Binding[];
  latest!: BindingValue[];
  VForReplacement!: { left: Identifiers; right: Identifiers }[];
  constructor() {
    this.reset();
  }
  reset(): void {
    this.bindings = [];
    this.latest = [];
    this.VForReplacement = [];
  }

  identifierOrExpressionNew(
    node: utils.SupportedNamedExpression | AST.ESLintCallExpression,
    bindingType: BindingType,
    usingMethodAsPropertyShorthand = false
  ): void {
    const item =
      node.type === AST_NODE_TYPES.CallExpression
        ? utils.method(node)
        : utils.property(node as utils.SupportedNamedExpression);
    if (usingMethodAsPropertyShorthand)
      this.latest.push({ item: method(item.id), bindingType });
    else this.latest.push({ item, bindingType });
  }

  elementWithVForStarted(vforAttributeNode: AST.VForExpression): void {
    // (item1, item2) in items Syntax NOT supported
    const left = utils.identifiers(
      //@unsafe
      vforAttributeNode.left[0] as utils.SupportedNamedExpression
    );
    //items
    const right = addIndex(
      utils.identifiers(
        //@unsafe
        vforAttributeNode.right as utils.SupportedNamedExpression
      )
    );
    this.VForReplacement.unshift({ left, right });
  }

  elementWithVForExited(): void {
    this.VForReplacement.shift();
  }

  nodeExited(node: AST.VElement): void {
    if (this.latest && this.latest.length != 0) {
      const id = utils.id(node);

      substituteVFor(this.VForReplacement, this.latest);

      const firstBindingName = render(this.latest[0].item.id);

      const name = determineNodeName(node, firstBindingName);

      const tag: Tag = { id, loc: node.loc, name };
      this.bindings.push({
        tag: tag,
        values: _.uniqWith(
          _.isEqual,
          filterOutMethodNamesAsIdentifiers(this.latest)
        ),
      });
      this.latest = [];
    }
  }

  build(): BindingsResult {
    const result = _.clone(this.bindings);

    this.reset();

    return { bindings: result };
  }
}
