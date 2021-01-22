import assert from "assert";

import _ from "lodash/fp";

import {
  Identifier,
  nextIndex,
  render as renderIdentifier,
  isIndex,
  isThis,
  ThisInstance,
  isGenericIndex,
} from "./identifier";

export type Identifiers = ReadonlyArray<Identifier>;

export function create(...data: Identifier[]): Identifiers {
  assert(data.length > 0);
  return data;
}

/**
 * Renders identifiers as string
 * @param that identifiers
 * @param includeThis if `this` should be included
 */
export function render(that: Identifiers, includeThis = true): string {
  const arr = startsWithThis(that) && !includeThis ? _.tail(that) : that;
  return _.reduce((acc: string, c: Identifier) => {
    const s = renderIdentifier(c);
    if (!acc) return s;
    return isIndex(c) ? acc.concat(s) : acc.concat("." + s);
  })("")(arr);
}

/**
 * Returns true if that starts with `this`
 * @param that identifiers
 */
export function startsWithThis(that: Identifiers): boolean {
  return isThis(_.head(that));
}

export function startsWith(that: Identifiers, start: Identifiers): boolean {
  assert(start.length > 0);
  if (start.length > that.length) return false;

  const startActual = _.take(start.length)(that);
  return _.isEqual(startActual, start);
}

export function prefixThis(that: Identifiers): Identifiers {
  return startsWithThis(that) ? that : prefix(that, ThisInstance);
}

export function prefix(
  that: Identifiers,
  prefix: Identifier | Identifiers
): Identifiers {
  return _.concat(prefix, that);
}
export function replaceFront(
  that: Identifiers,
  subList: Identifiers,
  replacement: Identifier | Identifiers
): Identifiers {
  //replace only if starts with
  return startsWith(that, subList)
    ? prefix(_.drop(subList.length, that), replacement)
    : that;
}

export function fixGenericIndices(that: Identifiers): Identifiers {
  const result = _.reduce((acc: Identifiers, c: Identifier) => {
    const last = _.last(acc);
    if (!last) return acc.concat(c);
    if (isGenericIndex(c) && isGenericIndex(last)) {
      return acc.concat(nextIndex(last));
    }
    return acc.concat(c);
  })([])(that);
  return result;
}

export function addIndex(that: Identifiers): Identifiers {
  const last = _.last(that);
  if (last) {
    const next = nextIndex(last);
    return _.concat(that, next);
  } else return that;
}

export function dropLast(that: Identifiers): Identifiers {
  const result = _.dropRight(1, that);
  return result;
}
