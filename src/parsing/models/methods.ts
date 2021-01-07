import _ from "lodash/fp";
import { Method, Property } from "./shared";

export class MethodDefintition {
  name: Property;
  args: ReadonlyArray<Method | Property>;
  reads: ReadonlyArray<Property>;
  writes: ReadonlyArray<Property>;
  calls: ReadonlyArray<Method>;
  constructor(
    name: Property,
    args: ReadonlyArray<Method | Property>,
    reads: ReadonlyArray<Property>,
    writes: ReadonlyArray<Property>,
    calls: ReadonlyArray<Method>
  ) {
    this.name = name;
    this.args = args;
    this.writes = _.uniqWith(_.isEqual, writes);

    this.reads = _.uniqWith(_.isEqual, reads);
    this.calls = _.uniqWith(_.isEqual, calls);
  }
}

export type MethodDefintitions = ReadonlyArray<MethodDefintition>;
