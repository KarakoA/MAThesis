import { nextChar } from "../utils2";

/**
 * Represents an identifier.
 */
export interface BaseIdentifier {
  readonly name: string;
}

export enum IdentifierType {
  THIS = "this",
  NUMERIC_INDEX = "numeric-index",
  GENERIC_INDEX = "generic-index",
  NAME_IDENTIFIER = "name-identifier",
}

export const This = {
  name: "this",
  discriminator: IdentifierType.THIS,
};

export type Identifier =
  | typeof This
  | NameIdentifier
  | NumericIndex
  | GenericIndex;

export interface NumericIndex extends BaseIdentifier {
  discriminator: IdentifierType.NUMERIC_INDEX;
}
export interface GenericIndex extends BaseIdentifier {
  discriminator: IdentifierType.GENERIC_INDEX;
}
export interface NameIdentifier extends BaseIdentifier {
  discriminator: IdentifierType.NAME_IDENTIFIER;
}

export function isNumericIndex(id: Identifier): id is NumericIndex {
  return id.discriminator === IdentifierType.NUMERIC_INDEX;
}
export function isGenericIndex(id: Identifier): id is GenericIndex {
  return id.discriminator === IdentifierType.GENERIC_INDEX;
}

export function isIndex(id: Identifier): id is NumericIndex | GenericIndex {
  return isNumericIndex(id) || isGenericIndex(id);
}
//TODO check this works as expected
export function isThis(id: Identifier): id is typeof This {
  return id.discriminator === IdentifierType.THIS;
}
export function isNameIdentifier(id: Identifier): id is NameIdentifier {
  return id.discriminator === IdentifierType.NAME_IDENTIFIER;
}

export function render(id: Identifier): string {
  return isIndex(id) ? `[${id.name}]` : id.name;
}

/**
 * Returns the next index based on previous.
 * If previous is a {@link GenericPosition}, next is the following character in the sequence i,j,k,l,m..., otherwise 'i'.
 * @param previous the previous position or undefined
 */
export function nextIndex(previous: Identifier | undefined): GenericIndex {
  const index =
    previous && isGenericIndex(previous) ? nextChar(previous.name) : "i";
  return { name: index, discriminator: IdentifierType.GENERIC_INDEX };
}
