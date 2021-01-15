import { Identifiers } from "../../common/models/identifiers";
import { Method, Property } from "./shared";
//TODO typo
export interface MethodDefintion {
  id: Identifiers;
  args: ReadonlyArray<Property>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<Method>;
}

export interface MethodsResult {
  init?: MethodDefintion;
  computed: MethodDefintitions;
  methods: MethodDefintitions;
}

//TODO typo
export type MethodDefintitions = Array<MethodDefintion>;

//#region Factory methods
export function methodDef(
  id: Identifiers,
  args: ReadonlyArray<Property> | undefined = undefined,
  reads: ReadonlyArray<Property> | undefined = undefined,
  writes: ReadonlyArray<Property> | undefined = undefined,
  calls: ReadonlyArray<Method> | undefined = undefined
): MethodDefintion {
  return {
    id,
    args: args ?? [],
    reads: reads ?? [],
    writes: writes ?? [],
    calls: calls ?? [],
  };
}
//#endregion
