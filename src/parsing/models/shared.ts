/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Identifiers } from "../../common/models/identifiers";

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
  return e?.discriminator === EntityType.PROPERTY;
}
export function isMethod(e: any): e is Method {
  return e?.discriminator === EntityType.METHOD;
}
export interface Method {
  id: Identifiers;
  args: ReadonlyArray<Entity>;
  discriminator: EntityType.METHOD;
}

//#region  Factory Methods
export function property(id: Identifiers): Property {
  return { id, discriminator: EntityType.PROPERTY };
}
export function method(
  id: Identifiers,
  args: ReadonlyArray<Entity> = []
): Method {
  return { id, discriminator: EntityType.METHOD, args };
}
//#endregion
