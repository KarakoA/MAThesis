import { ExtendedGraph } from "./graph";

import _ from "lodash/fp";
import { MethodResolver } from "./method-resolver";
import { Result } from "../parsing/models/result";
import { MethodDefintitions, MethodDefintion } from "../parsing/models/methods";
import * as identifiers from "../common/models/identifiers";
import { Identifiers } from "../common/models/identifiers";
import { BindingType, Binding } from "../parsing/models/template-bindings";
import {
  Entity,
  EntityType,
  isMethod,
  isProperty,
  Method,
} from "../parsing/models/shared";
import { MethodCache } from "./method-cache";
import {
  NodeType,
  TagNode,
  Node,
  EdgeType,
  MethodNode,
  DataNode,
  InitNode,
} from "./models/graph";
import { TopLevelVariables } from "../parsing/models/top-level-variables";
import {
  CalledMethod,
  ResolvedMethodDefintition,
} from "./models/method-resolver";
import * as identifier from "../common/models/identifier";
import { Identifier } from "../common/models/identifier";

export class Transformer {
  graph: ExtendedGraph;
  methodCache: MethodCache;

  computedIds: Identifiers[];

  bindings: Binding[];
  methods: MethodDefintitions;
  topLevel: TopLevelVariables;
  init?: MethodDefintion;

  constructor(visitorsResult: Result) {
    this.graph = new ExtendedGraph();
    const methodResolver = new MethodResolver(
      visitorsResult.methods,
      visitorsResult.topLevel
    );

    this.methodCache = new MethodCache(methodResolver);

    this.topLevel = visitorsResult.topLevel.topLevel;
    this.init = visitorsResult.methods.init;
    this.methods = visitorsResult.methods.methods;
    this.bindings = visitorsResult.bindings.bindings;
    this.computedIds = visitorsResult.methods.computed.map((x) => x.id);
  }

  compute(): ExtendedGraph {
    this.addTopLevel();
    this.addInit();
    this.addBindings();
    this.addIndirectlyCalledMethods();
    this.resolveDifferentDisplays();

    return this.graph;
  }
  private isComputedProperty(item: identifiers.Identifiers): boolean {
    return _.find(_.isEqual(item), this.computedIds) !== undefined;
  }
  private isInit(item: identifiers.Identifiers): boolean {
    return _.equals(this.init?.id, item);
  }

  private addTopLevel(): void {
    this.topLevel.forEach((topLevel) => this.addIdentifierChain(topLevel));
  }

  private addInit(): void {
    if (!this.init) throw new Error("No init method!");

    const initAsMethod: Method = {
      id: this.init.id,
      args: [],
      discriminator: EntityType.METHOD,
    };
    const resolved = this.methodCache.called(initAsMethod);
    const node = this.nodeFromMethod(resolved);
    this.graph.addNode(node);
  }
  private addBindings(): void {
    this.bindings.forEach((x) => {
      const tag = x.tag;
      const boundItems = x.values;
      const tagNode: TagNode = {
        id: tag.id,
        name: tag.name,
        loc: tag.loc,
        discriminator: NodeType.TAG,
      };
      //add the tag itself
      this.graph.addNode(tagNode);

      boundItems.forEach((binding) => {
        if (isProperty(binding.item)) {
          //compute property, treat as method
          if (this.isComputedProperty(binding.item.id)) {
            const itemAsMethod: Method = {
              id: identifiers.prefixThis(binding.item.id),
              args: [],
              discriminator: EntityType.METHOD,
            };
            const resolved = this.methodCache.called(itemAsMethod);
            const node = this.nodeFromMethod(resolved);
            this.addEdgeBasedOnBindingType(tagNode, node, binding.bindingType);
            //regular property
          } else {
            const item = {
              ...binding.item,
              id: identifiers.prefixThis(binding.item.id),
            };
            const last = this.addIdentifierChain(item);
            this.addEdgeBasedOnBindingType(tagNode, last, binding.bindingType);
          }
        }
        if (isMethod(binding.item)) {
          const resolved = this.methodCache.called({
            ...binding.item,
            id: identifiers.prefixThis(binding.item.id),
          });
          const node = this.nodeFromMethod(resolved);
          this.addEdgeBasedOnBindingType(tagNode, node, binding.bindingType);
        }
      });
    });
  }
  private addIndirectlyCalledMethods() {
    const methods = this.methodCache.allCalledMethods();
    methods.forEach((resolved) => {
      const node = this.nodeFromMethod(resolved);
      this.addEdgesMethod(node, resolved);
    });
    //TODO test with onClick="problem.item.push()" and see what happens if
    // wrong , need to also handle Property in allCalledMethods
  }

  //TODO naming
  private resolveDifferentDisplays() {
    this.graph.numericPositions();
  }

  //TODO rename add Entity or smth
  private addIdentifierChain(x: Entity): Node {
    const nodes = this.identifierToDataNodes(x.id);

    this.graph.addNodes(nodes);
    this.graph.connect(nodes);

    const last = _.last(nodes);
    if (!last)
      throw new Error("Got empty identifier. this should not be possible");
    return last;
  }

  private identifierToDataNodes(ids: Identifiers): DataNode[] {
    let prev: identifier.Identifier[] = [];
    const nodes = ids.map((current) => {
      let nameId: Identifier;
      if (identifier.isIndex(current)) {
        const last = _.last(prev);
        if (!last) throw new Error("Index as first element!");
        nameId = { ...current, name: last.name + identifier.render(current) };
      } else {
        nameId = current;
      }
      //TODO @check guaranteed to be only one?
      const parent = identifiers.render(prev);
      prev = prev.concat(nameId);

      const node: DataNode = {
        id: identifiers.render(prev),
        identifier: current,
        name: identifier.render(nameId),
        parent,

        discriminator: NodeType.DATA,
      };
      return node;
    });
    return nodes;
  }

  private addEdgesMethod(
    node: Node,
    resolved: ResolvedMethodDefintition
  ): void {
    const readNodes = resolved.reads.map((x) => this.addIdentifierChain(x));
    readNodes.forEach((source) =>
      this.graph.addEdge({ source, sink: node, label: EdgeType.SIMPLE })
    );

    const writeNodes = resolved.writes.map((x) => this.addIdentifierChain(x));
    writeNodes.forEach((sink) =>
      this.graph.addEdge({ source: node, sink, label: EdgeType.SIMPLE })
    );

    const callNodes = resolved.calls.map((x) => this.nodeFromMethod(x));
    callNodes.forEach((sink) =>
      this.graph.addEdge({ source: node, sink, label: EdgeType.CALLS })
    );
  }

  private addEdgeBasedOnBindingType(
    tag: TagNode,
    item: Node,
    type: BindingType
  ) {
    switch (type) {
      case BindingType.EVENT:
        this.graph.addEdge({ source: tag, sink: item, label: EdgeType.EVENT });
        break;
      case BindingType.ONE_WAY:
        this.graph.addEdge({
          source: item,
          sink: tag,
          label: EdgeType.SIMPLE,
        });
        break;
      case BindingType.TWO_WAY:
        this.graph.addEdge({ source: tag, sink: item, label: EdgeType.EVENT });
        this.graph.addEdge({
          source: item,
          sink: tag,
          label: EdgeType.SIMPLE,
        });
        break;
      default:
        throw new Error(`Unknown binding type: ${type}!`);
    }
  }
  /**
   * Creates a node from the given method definition, based on it's id and args.
   * If it's a computed property, brackets are ommited.
   * @param method method to create node from
   * @param isComputed if the method is a computed property
   */
  private nodeFromMethod(
    method: ResolvedMethodDefintition | CalledMethod
  ): MethodNode | InitNode {
    if (this.isInit(method.id)) {
      return {
        id: identifiers.render(method.id),
        name: identifiers.render(method.id, false),
        discriminator: NodeType.INIT,
      };
    }
    if (this.isComputedProperty(method.id))
      return {
        id: identifiers.render(method.id),
        name: identifiers.render(method.id, false),
        discriminator: NodeType.METHOD,
      };
    const argsIdsString = method.args
      .map((arg) => {
        if (isProperty(arg))
          return _.last(this.identifierToDataNodes(arg.id))?.toString() ?? "";
        return arg.toString();
      })
      .join(",");

    const id = `${identifiers.render(method.id)}(${argsIdsString})`;

    const argsString = method.args
      .map((arg) =>
        isProperty(arg) ? identifiers.render(arg.id, false) : arg.toString()
      )
      .join(",");

    const name = `${identifiers.render(method.id, false)}(${argsString})`;

    return { id: id, name: name, discriminator: NodeType.METHOD };
  }
}
