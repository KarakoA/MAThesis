import assert from "assert";

import _ from "lodash/fp";
import { zipWithIndex } from "../utils";

import {
  Identifier,
  nextIndex,
  render as renderIdentifier,
  isIndex,
  isThis,
  ThisInstance,
} from "./identifier";

export type Identifiers = ReadonlyArray<Identifier>;

export function create(...data: Identifier[]): Identifiers {
  assert(data.length > 0);
  return data;
}

export function render(that: Identifiers, includeThis = true): string {
  const arr = startsWithThis(that) && !includeThis ? _.tail(that) : that;
  return _.reduce((acc: string, c: Identifier) => {
    const s = renderIdentifier(c);
    if (!acc) return s;
    return isIndex(c) ? acc.concat(s) : acc.concat("." + s);
  })("")(arr);
}

export function startsWithThis(that: Identifiers): boolean {
  return isThis(_.head(that));
}

export function startsWith(that: Identifiers, start: Identifiers): boolean {
  assert(start.length > 0);
  if (start.length > that.length) return false;

  const startActual = _.take(that.length)(that);
  return _.isEqual(startActual, start);
}

export function prefixThis(that: Identifiers): Identifiers {
  return startsWithThis(that) ? that : prefix(that, ThisInstance);
}

export function prefix(
  that: Identifiers,
  prefix: Identifier | Identifiers
): Identifiers {
  //TODO do I need compact?
  return _.flow(_.concat(prefix), _.compact)(that);
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

export function replaceLast(
  that: Identifiers,
  replacement: Identifier | Identifiers
): Identifiers {
  return _.flow(_.dropRight(1), _.concat(replacement))(that);
}

export function addIndex(that: Identifiers): Identifiers {
  const last = _.last(that);
  if (last) {
    const next = nextIndex(last);
    return _.concat(that, next);
  } else return that;
}

export function isEqualIgnoringThis(x: Identifiers, y: Identifiers): boolean {
  return _.isEqual(x, y) || _.isEqual(prefixThis(x), prefixThis(y));
}

function longestMatchWithIndex(
  id: Identifiers,
  topLevel: Identifiers[]
): { item: Identifiers; i: number } | undefined {
  //TODO verify if non-matching is indeed undefined
  const startingWithId = zipWithIndex(topLevel).filter((x) =>
    //TODO might need reverse
    startsWith(x.item, id)
  );
  const longestMatch = _.maxBy((x) => x.item.length, startingWithId);
  return longestMatch;
}
export function findLongestMatch(
  id: Identifiers,
  topLevel: Identifiers[]
): Identifiers | undefined {
  const result = longestMatchWithIndex(id, topLevel);
  return result?.item;
}

export function findLongestMatchIndex(
  id: Identifiers,
  topLevel: Identifiers[]
): number {
  const result = longestMatchWithIndex(id, topLevel);
  return result?.i ?? -1;
}
