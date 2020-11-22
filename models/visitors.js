class BindingToName {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

class TemplateBinding {
  constructor(source, target, isEventBinding = false) {
    this.source = source;
    this.target = target;
    this.isEventBinding = isEventBinding;
  }
}

class TemplateBindings {
  constructor(bindings, tagsInfo) {
    this.bindings = bindings;
    this.tagsInfo = tagsInfo;
  }
}

class TopLevel {
  constructor(variableNames, methodNames, calledInInit) {
    this.variableNames = variableNames;
    this.methodNames = methodNames;
    this.calledInInit = calledInInit;
  }
}

class Methods {
  constructor(methods) {
    this.methods = methods;
  }
}

class Method {
  constructor(name, reads, writes, calls) {
    this.name = name;
    this.writes = writes;
    this.reads = reads;
    this.calls = calls;
  }
}

module.exports = {
  TemplateBinding,
  TemplateBindings,
  BindingToName,
  TopLevel,
  Method,
  Methods,
};
