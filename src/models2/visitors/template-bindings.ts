import assert from "assert";
import { Identifiers } from "../identifiers";

export enum BindingType {
  EVENT,
  ONE_WAY,
  TWO_WAY,
}

export interface Location {
  start: {
    column: number;
    line: number;
  };
  end: {
    column: number;
    line: number;
  };
}

export class Tag {
  id: Identifiers;
  loc: Location;
  name: string;
  position?: string;

  constructor(id: Identifiers, loc: Location, name: string, position?: string) {
    assert(id);
    this.id = id;
    this.name = name;
    this.loc = loc;
    this.position = position;
  }
}
