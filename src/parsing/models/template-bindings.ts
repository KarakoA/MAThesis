import assert from "assert";
import { Identifiers } from "../../models2/identifiers";

import { Method, Property } from "./shared";
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
  id: string;
  loc: Location;
  name: string;
  position?: string;

  constructor(id: string, loc: Location, name: string, position?: string) {
    assert(id);
    this.id = id;
    this.name = name;
    this.loc = loc;
    this.position = position;
  }
}

export class BindingValue {
  item: Method | Property;
  bindingType: BindingType;
  constructor(item: Method | Property, bindingType: BindingType) {
    this.item = item;
    this.bindingType = bindingType;
  }
}
export type BindingsResult = Map<Tag, Array<BindingValue>>;
