import _ from "lodash/fp";

export function nextChar(i: string): string {
  return String.fromCharCode(i.charCodeAt(0) + 1);
}

/**
 * Immitates monadic lifting to enable usage with lodash flatten and flatMap.
 * @param x the value to lift
 */
export function lift<T>(x: T | undefined): [] | T {
  return x ? x : [];
}

/**
 * Asserts the passed value is not null
 * @param x value
 */
export function nonNull<T>(x: T | undefined): T {
  if (_.isNil(x)) throw new Error("Assertion error: nonNull() got undefined!");
  return x;
}
//type alias for any object, less cryptic, used for serialization
export type JSObject = Record<string, unknown>;
