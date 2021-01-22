import { ThisInstance as This, named, generic, numeric } from "./identifier";
import * as identifiers from "./identifiers";

const id = {
  this: This,
  A: named("A"),
  B: named("B"),
  C: named("C"),

  i: generic("i"),
  j: generic("j"),

  index1: numeric("1"),
};

describe("Identifiers", () => {
  describe("render", () => {
    test("excludes this if includeThis is false", () => {
      expect(identifiers.render([id.this, id.A], false)).toBe("A");
    });
    test("renders complex identifiers correctly", () => {
      expect(
        identifiers.render([id.this, id.A, id.B, id.index1, id.i, id.j, id.C])
      ).toBe("this.A.B[1][i][j].C");
    });
  });
  describe("startsWith", () => {
    test("returns true if x starts with y", () => {
      expect(
        identifiers.startsWith([id.this, id.A, id.B], [id.this, id.A])
      ).toBeTruthy();
    });
    test("returns false if x doesn't start with y", () => {
      expect(
        identifiers.startsWith([id.A, id.B], [id.A, id.B, id.C])
      ).toBeFalsy();
    });
    test("returns false if x is completely different from y", () => {
      expect(identifiers.startsWith([id.A, id.C], [id.B])).toBeFalsy();
    });
  });

  describe("prefix", () => {
    test("prefixes an identifier correctly", () => {
      expect(identifiers.prefix([id.B, id.C], id.A)).toStrictEqual([
        id.A,
        id.B,
        id.C,
      ]);
    });
    test("prefixes identifiers correctly", () => {
      expect(identifiers.prefix([id.B, id.C], [id.this, id.A])).toStrictEqual([
        id.this,
        id.A,
        id.B,
        id.C,
      ]);
    });
  });
  describe("prefixThis", () => {
    test("prefixes with this", () => {
      expect(identifiers.prefixThis([id.A, id.B])).toStrictEqual([
        id.this,
        id.A,
        id.B,
      ]);
    });

    test("is idempotent", () => {
      expect(
        identifiers.prefixThis(identifiers.prefixThis([id.A, id.B]))
      ).toStrictEqual([id.this, id.A, id.B]);
    });
  });

  describe("replaceFront", () => {
    test("replaces if starts with", () => {
      expect(
        identifiers.replaceFront(
          [id.A, id.B, id.C],
          [id.A, id.B],
          [id.this, id.B]
        )
      ).toStrictEqual([id.this, id.B, id.C]);
    });
    test("doesn't replaces if doesn't starts with", () => {
      expect(
        identifiers.replaceFront([id.A, id.B, id.C], [id.C], [id.this, id.B])
      ).toStrictEqual([id.A, id.B, id.C]);
    });
  });

  describe("addIndex", () => {
    test("adds 'i' after a simple name", () => {
      expect(identifiers.addIndex([id.A, id.B, id.C])).toStrictEqual([
        id.A,
        id.B,
        id.C,
        id.i,
      ]);
    });
    test("adds 'i' after a numeric index", () => {
      expect(
        identifiers.addIndex([id.A, id.B, id.C, id.index1])
      ).toStrictEqual([id.A, id.B, id.C, id.index1, id.i]);
    });
    test("adds 'j' after a generic index 'i'", () => {
      expect(identifiers.addIndex([id.A, id.B, id.C, id.i])).toStrictEqual([
        id.A,
        id.B,
        id.C,
        id.i,
        id.j,
      ]);
    });
  });
});
