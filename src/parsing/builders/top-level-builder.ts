import { prefixThis } from "../../common/models/identifiers";
import { EntityType } from "../models/shared";
import {
  TopLevelProperties,
  TopLevelPropertiesResult,
} from "../models/top-level-properties";
import { AST, IdentifiersFromTopLevelObject } from "../utils";

export class TopLevelPropertiesBuilder {
  build(node: AST.ESLintObjectExpression): TopLevelPropertiesResult {
    const id = IdentifiersFromTopLevelObject(node);

    const topLevel: TopLevelProperties = id.map((id) => {
      return { id: prefixThis(id), discriminator: EntityType.PROPERTY };
    });

    return { topLevel: topLevel };
  }
}
