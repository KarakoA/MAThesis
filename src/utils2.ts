import { assert } from "console";

//TODO rename to utils and other to eslint utils
export function nextChar(i: string): string {
  //TODO remove me, backwards compat

  return i ? String.fromCharCode(i.charCodeAt(0) + 1) : "i";
  return String.fromCharCode(i.charCodeAt(0) + 1);
}

/**
 * Immitates monadic lifting to enable usage with lodash flatten and flatMap.
 * @param x the value to lift
 */
export function lift<T>(x: T | undefined): [] | T {
  return x ? x : [];
}

export function nonNull<T>(x: T | undefined): T {
  if (x) return x;
  throw new Error("Assertion error: nonNull() got undefined!");
}
//type alias for any object, less cryptic, used for serialization
export type JSObject = Record<string, unknown>;
