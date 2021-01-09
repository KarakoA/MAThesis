import { prefixThis } from "../../models2/identifiers";
import { EntityType } from "../models/shared";
import {
  TopLevelVariables,
  TopLevelVariablesResult,
} from "../models/top-level-variables";
import { AST, getNamesFromTopLevelObject } from "../utils";

export class TopLevelVariablesBuilder {
  build(node: AST.ESLintObjectExpression): TopLevelVariablesResult {
    const id = getNamesFromTopLevelObject(node);

    const topLevel: TopLevelVariables = id.map((id) => {
      return { id: prefixThis(id), discriminator: EntityType.PROPERTY };
    });

    return { topLevel: topLevel };
  }
}
