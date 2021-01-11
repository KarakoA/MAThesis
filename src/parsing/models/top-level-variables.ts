import { Identifiers, prefixThis, startsWith } from "../../models2/identifiers";
import {
  startsWithThis,
  findLongestMatch as identifiersLongestMatch,
} from "../../models2/identifiers";
import { EntityType, Property } from "./shared";
import _ from "lodash/fp";

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
