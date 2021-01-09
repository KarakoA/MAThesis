import _ from "lodash/fp";
import { Identifiers } from "../../models2/identifiers";
import { Method, Property } from "./shared";

export interface MethodDefintition {
  id: Identifiers;
  args: ReadonlyArray<Property>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<Method>;
}

export interface MethodsResult {
  init?: MethodDefintition;
  computed: MethodDefintitions;
  methods: MethodDefintitions;
}

export type MethodDefintitions = Array<MethodDefintition>;
