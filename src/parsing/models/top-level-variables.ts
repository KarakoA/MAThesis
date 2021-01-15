import { Identifiers, prefixThis } from "../../common/models/identifiers";
import { startsWithThis } from "../../common/models/identifiers";
import { EntityType, Property } from "./shared";

export enum DataType {
  ARRAY,
  OTHER,
}

export type TopLevelVariables = Array<Property>;

export interface TopLevelVariablesResult {
  topLevel: TopLevelVariables;
}
