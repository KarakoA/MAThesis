import _ from "lodash/fp";
import { Identifiers } from "../../models2/identifiers";
import { Method, Property, Entity } from "./shared";

export interface MethodDefintition {
  id: Identifiers;
  args: ReadonlyArray<Entity>;
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
