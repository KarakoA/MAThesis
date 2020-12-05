let utils = require("./utils");
const {
  BindingToName,
  TemplateBinding,
  TemplateBindings,
} = require("./models/visitors");

const bindingTypes = {
  TWO_WAY: "two-way",
  ONE_WAY: "one-way",
  CLICK_HANDLER: "click-handler",
};
class BindingsState {
  constructor() {
    this.reset();
  }
  reset() {
    this.bindings = [];
    this.tagsInfo = [];
    this.latestBindings = [];
    this.reset_data();
  }

  reset_data() {
    this.stack = [];
    this.longest = [];

    this.bindingType = undefined;
  }

  identifierOrExpressionNew(simpleName, bindingType) {
    if (!this.bindingType) this.bindingType = bindingType;
    this.stack.push(simpleName);
  }

  identifierOrExpressionExit() {
    if (this.stack.length > this.longest.length) this.longest = [...this.stack];

    this.stack.pop();
    if (this.stack.length == 0) {
      let name = this.longest.reverse().join(".");
      this.latestBindings.push({ name, bindingType: this.bindingType });
      this.reset_data();
    }
  }

  nodeExited(node) {
    if (this.latestBindings.length != 0) {
      let id = utils.id(node);
      let newBindings = this.latestBindings
        .map((x) => {
          switch (x.bindingType) {
            case bindingTypes.ONE_WAY:
              return [new TemplateBinding(x.name, id, false)];
            case bindingTypes.CLICK_HANDLER:
              return [new TemplateBinding(id, x.name, true)];
            case bindingTypes.TWO_WAY:
              return [
                new TemplateBinding(x.name, id, false),
                new TemplateBinding(id, x.name, false),
              ];
          }
        })
        .flat();

      this.bindings = this.bindings.concat(newBindings);

      //simple name, raw string
      let firstVText = node.children
        .find((x) => x.type === "VText" && x.value.trim())
        ?.value.trim();

      let firstBinding = this.latestBindings[0].name;

      // if both fail, just the name of the node
      let name = firstVText ?? firstBinding ?? node.name;
      this.tagsInfo.push(new BindingToName(id, name, node.loc));

      this.latestBindings = [];
    }
  }

  finish() {
    return new TemplateBindings(this.bindings, this.tagsInfo);
  }
}

module.exports = { BindingsState, bindingTypes };
