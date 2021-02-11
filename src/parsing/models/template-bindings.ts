import { Entity } from "./shared";
import type { LocationRange as Location } from "vue-eslint-parser/ast";

export type { LocationRange as Location } from "vue-eslint-parser/ast";
export enum BindingType {
  EVENT = "event",
  ONE_WAY = "one-way",
  TWO_WAY = "two-way",
}

export interface Tag {
  id: string;
  loc: Location;
  name: string;
}

export interface BindingValue {
  item: Entity;
  bindingType: BindingType;
}

export type Binding = { tag: Tag; values: BindingValue[] };
export interface BindingsResult {
  bindings: Binding[];
}
