import { nextChar, prevChar } from "../utils";

export enum IdentifierType {
  THIS = "this",
  NUMERIC_INDEX = "numeric-index",
  GENERIC_INDEX = "generic-index",
  NAME_IDENTIFIER = "name-identifier",
}

/**
 * Represents an identifier.
 */
export type Identifier = This | NameIdentifier | NumericIndex | GenericIndex;

interface BaseIdentifier {
  readonly name: string;
}

/**
 * 'this' in this.x[i][1]
 */
export interface This extends BaseIdentifier {
  name: "this";
  discriminator: IdentifierType.THIS;
}

/**
 * '1' in  this.x[i][1]
 */
export interface NumericIndex extends BaseIdentifier {
  discriminator: IdentifierType.NUMERIC_INDEX;
}

/**
 * 'i' in  this.x[i][1]
 */
export interface GenericIndex extends BaseIdentifier {
  discriminator: IdentifierType.GENERIC_INDEX;
}
/**
 * 'x' in  this.x[i][1]
 */
export interface NameIdentifier extends BaseIdentifier {
  discriminator: IdentifierType.NAME_IDENTIFIER;
}

//#region user defined type guards

export function isThis(id: Identifier | undefined): id is This {
  return id?.discriminator === IdentifierType.THIS;
}
export function isNameIdentifier(
  id: Identifier | undefined
): id is NameIdentifier {
  return id?.discriminator === IdentifierType.NAME_IDENTIFIER;
}

export function isNumericIndex(id: Identifier | undefined): id is NumericIndex {
  return id?.discriminator === IdentifierType.NUMERIC_INDEX;
}
export function isGenericIndex(id: Identifier | undefined): id is GenericIndex {
  return id?.discriminator === IdentifierType.GENERIC_INDEX;
}

//either numeric or genereic
export function isIndex(
  id: Identifier | undefined
): id is NumericIndex | GenericIndex {
  return isNumericIndex(id) || isGenericIndex(id);
}

//#endregion

//#region Factory Methods

export const ThisInstance: This = {
  name: "this",
  discriminator: IdentifierType.THIS,
};

export function generic(name: string): GenericIndex {
  return { name: name, discriminator: IdentifierType.GENERIC_INDEX };
}

export function numeric(name: string): NumericIndex {
  return { name: name, discriminator: IdentifierType.NUMERIC_INDEX };
}

export function named(name: string): NameIdentifier {
  return { name: name, discriminator: IdentifierType.NAME_IDENTIFIER };
}
//#region

/**
 * Renders the given identifier to a string
 * @param id identifier
 */
export function render(id: Identifier): string {
  return isIndex(id) ? `[${id.name}]` : id.name;
}

/**
 * Returns the next index based on previous.
 * If previous is a {@link GenericPosition}, next is the following character in the sequence i,j,k,l,m..., otherwise 'i'.
 * @param previous previous
 */
export function nextIndex(previous: Identifier | undefined): GenericIndex {
  const index =
    previous && isGenericIndex(previous) ? nextChar(previous.name) : "i";
  return { name: index, discriminator: IdentifierType.GENERIC_INDEX };
}
/**
 * Returns the previous index.
 * If current is a {@link GenericPosition}, previous character in the sequence i,j,k,l,m....
 * Raises an error if previous is not a {@link GenericPosition } or called on 'i'
 * @param current previous
 */
export function prevIndex(current: Identifier | undefined): GenericIndex {
  if (
    !current ||
    !isGenericIndex(current) ||
    (isGenericIndex(current) && current.name === "i")
  )
    throw new Error(
      `${
        current ? render(current) : ""
      } is either not a generic index or is 'i'!`
    );
  return {
    name: prevChar(current.name),
    discriminator: IdentifierType.GENERIC_INDEX,
  };
}
