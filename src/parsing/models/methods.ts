import { Identifiers } from "../../common/models/identifiers";
import { Method, Property } from "./shared";

export interface MethodDefinition {
  id: Identifiers;
  args: ReadonlyArray<Property>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<Method>;
}

export type MethodDefinitions = Array<MethodDefinition>;

export interface MethodsResult {
  init?: MethodDefinition;
  computed: MethodDefinitions;
  methods: MethodDefinitions;
}

//#region Factory methods
export function methodDef(
  id: Identifiers,
  args: ReadonlyArray<Property> | undefined = undefined,
  reads: ReadonlyArray<Property> | undefined = undefined,
  writes: ReadonlyArray<Property> | undefined = undefined,
  calls: ReadonlyArray<Method> | undefined = undefined
): MethodDefinition {
  return {
    id,
    args: args ?? [],
    reads: reads ?? [],
    writes: writes ?? [],
    calls: calls ?? [],
  };
}
//#endregion
