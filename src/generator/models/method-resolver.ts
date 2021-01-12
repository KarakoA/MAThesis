import { Identifiers } from "../../models2/identifiers";
import { Property, Method } from "../../parsing/models/shared";

export enum GeneralisedArgument {
  METHOD = "method",
  //"not this"
  OTHER = "other",
}
export type ResolvedArgument =
  | Property
  | GeneralisedArgument.METHOD
  | GeneralisedArgument.OTHER;

export interface ResolvedMethodDefintition {
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

//interface Method

//custom exception - unsupported exception TODO
