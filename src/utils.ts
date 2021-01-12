import _ from "lodash/fp";

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

export function zipWithIndex<T>(data: Array<T>): { item: T; i: number }[] {
  const zipped = _.zip(data, _.range(0, data.length));
  const transformed = zipped.map(([x, i]) => {
    return { item: nonNull(x), i: nonNull(i) };
  });
  return transformed;
}

export function nonNull<T>(x: T | undefined): T {
  if (_.isNil(x)) throw new Error("Assertion error: nonNull() got undefined!");
  return x;
}
//type alias for any object, less cryptic, used for serialization
export type JSObject = Record<string, unknown>;
