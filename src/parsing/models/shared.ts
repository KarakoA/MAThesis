import { Identifier } from "../../models2/identifier";
import { Identifiers } from "../../models2/identifiers";

export enum EntityType {
  PROPERTY = "property",
  METHOD = "method",
}

export type Entity = Method | Property;

export interface Property {
  id: Identifiers;
  discriminator: EntityType.PROPERTY;
}
export function isProperty(e: any): e is Property {
  return e.discriminator === EntityType.PROPERTY;
}
export function isMethod(e: any): e is Method {
  return e.discriminator === EntityType.METHOD;
}
export interface Method {
  id: Identifiers;
  args: Array<Entity>;
  discriminator: EntityType.METHOD;
}
