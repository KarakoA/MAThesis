import assert from "assert";
import { Identifiers } from "../identifiers";

export interface Entity {
  id: Identifiers;
}
export class BaseEntity implements Entity {
  id: Identifiers;
  constructor(id: Identifiers) {
    assert(id);
    this.id = id;
  }
}

export class Method extends BaseEntity {
  args: ReadonlyArray<Method | Property>;
  constructor(id: Identifiers, args = []) {
    super(id);
    this.args = args;
  }
}

export class Property extends BaseEntity {
  constructor(id: Identifiers) {
    super(id);
  }
}
