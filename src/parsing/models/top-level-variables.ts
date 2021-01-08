import { Property } from "./shared";

export enum DataType {
  ARRAY,
  OTHER,
}

type TopLevelVariables = Array<Property>;

export interface TopLevelVariablesResult {
  topLevel: TopLevelVariables;
}
