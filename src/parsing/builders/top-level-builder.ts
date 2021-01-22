import { prefixThis } from "../../common/models/identifiers";
import { EntityType } from "../models/shared";
import {
  TopLevelVariables,
  TopLevelVariablesResult,
} from "../models/top-level-variables";
import { AST, IdentifiersFromTopLevelObject } from "../utils";

export class TopLevelVariablesBuilder {
  build(node: AST.ESLintObjectExpression): TopLevelVariablesResult {
    const id = IdentifiersFromTopLevelObject(node);

    const topLevel: TopLevelVariables = id.map((id) => {
      return { id: prefixThis(id), discriminator: EntityType.PROPERTY };
    });

    return { topLevel: topLevel };
  }
}
