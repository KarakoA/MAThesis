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
} from "../../common/models/identifiers";
import _ from "lodash/fp";
import {
  EntityType,
  isMethod,
  isProperty,
  Method,
  Property,
} from "../models/shared";

export function determineNodeName(
  node: AST.VElement,
  firstBindingName?: string
): string {
  //simple name, raw string
  const firstVText = node.children.find(
    (x) => x.type === "VText" && x.value.trim()
  ) as AST.VText;
  // if both fail, just the name of the node
  const name = firstVText?.value.trim() ?? firstBindingName ?? node.name;
  return name;
}

function filterOutMethodNamesAsIdentifiers(
  latest: BindingValue[]
): BindingValue[] {
  //TODO toSet has better perfornamce, but can't compare with isEqual
  const methodNames = latest
    .filter((x) => isMethod(x.item))
    .map((x) => x.item.id);

  //TODO @maybe (isEqual replaced based on rule)
  const inNames = (x: Identifiers) => _.some(_.isEqual(x), methodNames);
  return latest.filter((x) => !(isProperty(x.item) && inNames(x.item.id)));
}

function substituteVFor(
  replacements: { left: Identifiers; right: Identifiers }[],
  data: BindingValue[]
) {
  replacements.forEach((replacement) => {
    data.forEach((x) => {
      x.item.id = replaceFront(x.item.id, replacement.left, replacement.right);
      //TODO needs to be recursive probably for nested methods (if supported)
      if (isMethod(x.item))
        x.item.args = x.item.args?.map((arg) => {
          return isProperty(arg)
            ? {
                id: replaceFront(arg.id, replacement.left, replacement.right),
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
    bindingType: BindingType
  ): void {
    const item =
      node.type === AST_NODE_TYPES.CallExpression
        ? utils.method(node)
        : utils.property(node);
    this.latest.push({ item, bindingType });
  }

  elementWithVForStarted(vforAttributeNode: AST.VForExpression): void {
    //item in items
    //item
    //TODO problems with (item1, item2) in items....
    //TODO can it be items in problems[0]? how would I resolve that one? Should be possible
    //also how to add i accesses, see problem above
    const left = utils.identifiers(
      //TODO @unsafe
      vforAttributeNode.left[0] as utils.SupportedNamedExpression
    );
    //items
    const right = addIndex(
      utils.identifiers(
        //TODO @unsafe
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
      //TODO could apply the substitution on it for more info, but maybe don't even need this at all, will see
      //let position = this.VForReplacement[0];

      const position = this.VForReplacement.length == 0 ? undefined : "i";
      //const tag = new TagI(id, node.loc, name, position);
      const tag: Tag = { id, loc: node.loc, name, position };
      this.bindings.push({
        tag: tag,
        values: filterOutMethodNamesAsIdentifiers(this.latest),
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
