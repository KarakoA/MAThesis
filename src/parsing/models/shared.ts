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
export function isProperty(e: Entity): e is Property {
  return e.discriminator === EntityType.PROPERTY;
}
export function isMethod(e: Entity): e is Method {
  return e.discriminator === EntityType.METHOD;
}
export interface Method {
  id: Identifiers;
  args: Array<Entity>;
  discriminator: EntityType.METHOD;
}
