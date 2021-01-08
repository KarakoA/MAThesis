import { Method, Property, Entity } from "./shared";
import _ from "lodash/fp";
import { deserialize, serialize } from "v8";
export enum BindingType {
  EVENT = "event",
  ONE_WAY = "one-way",
  TWO_WAY = "two-way",
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

export interface Tag {
  id: string;
  loc: Location;
  name: string;
  position?: string;
}

export interface BindingValue {
  item: Entity;
  bindingType: BindingType;
}

export interface BindingsResult {
  bindings: Map<Tag, Array<BindingValue>>;
}

export function serializeResult(res: BindingsResult): string {
  return JSON.stringify(Array.from(res.bindings));
}
export function deserializeResult(json: string): BindingsResult {
  return { bindings: new Map(JSON.parse(json)) };
}
