import { Identifiers } from "../../models2/identifiers";

import _ from "lodash/fp";
export enum EntityType {
  PROPERTY = "property",
  METHOD = "method",
}

export type Entity = Method | Property;

export function withId(
  entity: Entity,
  identifier: Identifiers | ((id: Identifiers) => Identifiers)
): Entity {
  const id = _.isFunction(identifier) ? identifier(entity.id) : identifier;
  return { ...entity, id };
}
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
