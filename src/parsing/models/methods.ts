import _ from "lodash/fp";
import { Identifiers } from "../../common/models/identifiers";
import { Method, Property } from "./shared";

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

export type MethodDefintitions = Array<MethodDefintion>;
