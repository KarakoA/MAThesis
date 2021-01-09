import { Identifiers, prefixThis, startsWith } from "../../models2/identifiers";
import { startsWithThis } from "../../models2/identifiers";
import { Property } from "./shared";
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

  const thisId = prefixThis(id);

  //TODO verify if non-matching is undefined
  const longestMatch = _.flow(
    _.filter((x: Property) => startsWith(x.id, thisId)),
    _.sortBy((x) => x.id.length),
    _.head
  )(topLevel);
  return longestMatch;
}
