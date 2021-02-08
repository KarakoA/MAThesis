import { Property } from "./shared";

export enum DataType {
  ARRAY,
  OTHER,
}

export type TopLevelProperties = Array<Property>;

export interface TopLevelPropertiesResult {
  topLevel: TopLevelProperties;
}
