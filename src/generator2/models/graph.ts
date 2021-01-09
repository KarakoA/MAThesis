export interface Node {
  
  constructor({ id, name, opts = undefined, parent = undefined }) {
    this.id = id;
    this.parent = parent;
    this.label = { name, opts };
  }
}
