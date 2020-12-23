class NameResolver {
  constructor() {
    this.reset();
  }
  reset() {
    this.latest = [];
    this.reset_data();
  }

  reset_data() {
    this.stack = [];
    this.longest = [];

    this.options = undefined;
  }

  identifierOrExpressionNew(simpleName, options) {
    if (!this.options) this.options = options;
    this.stack.push(simpleName);
  }

  identifierOrExpressionExit() {
    if (this.stack.length > this.longest.length) this.longest = [...this.stack];

    this.stack.pop();
    if (this.stack.length == 0) {
      let name = this.longest.reverse().join(".");
      this.latest.push({ name, options: this.options });
      this.reset_data();
    }
  }

  nodeExited() {
    let tmp = [...this.latest];
    this.latest = [];
    return tmp;
  }
}

module.exports = { NameResolver };
