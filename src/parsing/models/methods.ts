import _ from "lodash/fp";
import { Identifiers } from "../../models2/identifiers";
import { Method, Property } from "./shared";

export class MethodDefintition {
  id: Identifiers;
  args: ReadonlyArray<Method | Property>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<Method>;
  constructor(
    id: Identifiers,
    args: ReadonlyArray<Method | Property>,
    reads: ReadonlyArray<Property>,
    writes: ReadonlyArray<Property>,
    calls: ReadonlyArray<Method>
  ) {
    this.id = id;
    this.args = args;
    this.writes = _.uniqWith(_.isEqual, writes);

    this.reads = _.uniqWith(_.isEqual, reads);
    this.calls = _.uniqWith(_.isEqual, calls);
  }
}

export class MethodsResult {
  init?: MethodDefintition;
  computed: MethodDefintitions;
  methods: MethodDefintitions;
  constructor(
    computed: MethodDefintitions,
    methods: MethodDefintitions,
    init?: MethodDefintition
  ) {
    this.init = init;
    this.computed = computed;
    this.methods = methods;
  }
}

export type MethodDefintitions = Array<MethodDefintition>;
