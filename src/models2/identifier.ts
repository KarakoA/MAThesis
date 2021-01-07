import assert from "assert";

import { nextChar } from "../utils2";

/**
 * Represents an identifier.
 */
export interface Identifier {
  readonly name: string;
  render(): string;
}

/* #region  Local */

class BaseIdentifier implements Identifier {
  name: string;
  constructor(name: string) {
    assert(name);
    this.name = name;
  }
  render(): string {
    return this.name;
  }
}

class BaseIndexIdentifier extends BaseIdentifier {
  constructor(name: string) {
    super(name);
  }
  render(): string {
    return `[${this.name}]`;
  }
}

class ThisIdentifier extends BaseIdentifier {
  constructor(name: string) {
    super(name);
  }
}

/* #endregion */

export const This = new ThisIdentifier("this");

export class NumericIndex extends BaseIndexIdentifier {
  constructor(name: number) {
    super(name.toString());
  }
}

export class GenericIndex extends BaseIndexIdentifier {
  constructor(name: string) {
    super(name);
  }
}

export class NameIdentifier extends BaseIdentifier {
  constructor(name: string) {
    super(name);
  }
}

/**
 * Returns the next index based on previous.
 * If previous is a {@link GenericPosition}, next is the following character in the sequence i,j,k,l,m..., otherwise 'i'.
 * @param previous the previous position or undefined
 */
export function nextIndex(previous: Identifier | undefined): GenericIndex {
  const index =
    previous instanceof GenericIndex ? nextChar(previous.name) : "i";
  return new GenericIndex(index);
}
