import { Identifiers } from "../identifiers";
import { Property } from "./shared";

export enum DataType {
  ARRAY,
  OTHER,
}

export class TopLevelVariable extends Property {
  constructor(id: Identifiers) {
    super(id);
  }
}
