import assert from "assert";
import { Identifiers } from "../../models2/identifiers";

export interface Entity {
  id: Identifiers;
}
class BaseEntity implements Entity {
  id: Identifiers;
  constructor(id: Identifiers) {
    assert(id);
    this.id = id;
  }
}

export class Method extends BaseEntity {
  args: Array<Method | Property>;
  constructor(id: Identifiers, args: Array<Method | Property> = []) {
    super(id);
    this.args = args;
  }
}

export class Property extends BaseEntity {
  constructor(id: Identifiers) {
    super(id);
  }
}
