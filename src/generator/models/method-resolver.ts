import { Identifiers } from "../../common/models/identifiers";
import { Property } from "../../parsing/models/shared";

export enum GeneralisedArgument {
  METHOD = "method",
  OTHER = "other",
}
export type ResolvedArgument =
  | Property
  | GeneralisedArgument.METHOD
  | GeneralisedArgument.OTHER;

export interface ResolvedMethodDefinition {
  id: Identifiers;
  args: ReadonlyArray<ResolvedArgument>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<CalledMethod>;
}

export interface CalledMethod {
  id: Identifiers;
  args: ReadonlyArray<ResolvedArgument>;
}

export function isCalledMethod(e: CalledMethod | Property): e is CalledMethod {
  return "args" in e;
}
