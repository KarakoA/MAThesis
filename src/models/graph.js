class Node {
  constructor(id, name, opts = undefined) {
    this.id = id;
    this.label = { name, opts };
  }
}
module.exports = { Node };
