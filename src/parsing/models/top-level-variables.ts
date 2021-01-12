import { Identifiers, prefixThis } from "../../common/models/identifiers";
import {
  startsWithThis,
  findLongestMatch as identifiersLongestMatch,
} from "../../common/models/identifiers";
import { EntityType, Property } from "./shared";

export enum DataType {
  ARRAY,
  OTHER,
}

export type TopLevelVariables = Array<Property>;

export interface TopLevelVariablesResult {
  topLevel: TopLevelVariables;
}

export function findClosestMatch(
  id: Identifiers,
  topLevel: TopLevelVariables,
  shouldPrefixThis = false
): Property | undefined {
  if (!startsWithThis(id) && !shouldPrefixThis) return undefined;
  //if already had this, would not be doubled
  const thisId = prefixThis(id);

  const found = identifiersLongestMatch(
    thisId,
    topLevel.map((x) => x.id)
  );
  return found ? { id: found, discriminator: EntityType.PROPERTY } : undefined;
}
