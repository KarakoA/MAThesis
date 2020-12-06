let utils = require("../utils");
const { NameResolver } = require("../utils/name-resolver");
const {
  BindingToName,
  TemplateBinding,
  TemplateBindings,
} = require("../models/visitors");

const bindingTypes = {
  TWO_WAY: "two-way",
  ONE_WAY: "one-way",
  CLICK_HANDLER: "click-handler",
};
class BindingsState {
  constructor() {
    this.nameResolver = new NameResolver();
    this.reset();
  }
  reset() {
    this.bindings = [];
    this.tagsInfo = [];
    this.nameResolver.reset();
  }

  identifierOrExpressionNew(simpleName, bindingType) {
    this.nameResolver.identifierOrExpressionNew(simpleName, bindingType);
  }

  identifierOrExpressionExit() {
    this.nameResolver.identifierOrExpressionExit();
  }

  nodeExited(node) {
    let bindings = this.nameResolver.nodeExited();
    if (bindings.length != 0) {
      let id = utils.id(node);
      let newBindings = bindings
        .map((x) => {
          switch (x.options) {
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

      let firstBinding = bindings[0].name;

      // if both fail, just the name of the node
      let name = firstVText ?? firstBinding ?? node.name;
      this.tagsInfo.push(new BindingToName(id, name, node.loc));
    }
  }

  finish() {
    return new TemplateBindings(this.bindings, this.tagsInfo);
  }
}

module.exports = { BindingsState, bindingTypes };
