import { ExtendedGraph } from "./graph";

import _ from "lodash/fp";
import { MethodResolver } from "./method-resolver";
import { Result } from "../parsing/models/result";
import { MethodDefinitions, MethodDefinition } from "../parsing/models/methods";
import * as identifiers from "../common/models/identifiers";
import { Identifiers } from "../common/models/identifiers";
import { BindingType, Binding } from "../parsing/models/template-bindings";
import {
  EntityType,
  isMethod,
  isProperty,
  Method,
  Property,
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
import { lift } from "../common/utils";

export class Transformer {
  graph: ExtendedGraph;
  methodCache: MethodCache;

  computedIds: Identifiers[];

  bindings: Binding[];
  methods: MethodDefinitions;
  topLevel: TopLevelVariables;
  init?: MethodDefinition;

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

  //#region Compute
  compute(): ExtendedGraph {
    this.addTopLevelVariables();
    this.addInit();
    this.addBindings();
    this.addIndirectlyCalledMethods();
    //must be called after all edges have been added
    this.addEdgesForNumerics();

    return this.graph;
  }

  private addTopLevelVariables(): void {
    this.topLevel.forEach((topLevel) => this.addProperty(topLevel));
  }

  private addInit(): void {
    if (!this.init) throw new Error("No init method!");

    const initAsMethod: Method = {
      id: this.init.id,
      args: [],
      discriminator: EntityType.METHOD,
    };
    const resolved = this.methodCache.called(initAsMethod);
    //should always be a method
    if (isProperty(resolved)) {
      throw new Error("Init resolved to property (should not be possible)!");
    }
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
          if (
            this.isComputedProperty(identifiers.prefixThis(binding.item.id))
          ) {
            const itemAsMethod: Method = {
              id: identifiers.prefixThis(binding.item.id),
              args: [],
              discriminator: EntityType.METHOD,
            };
            const resolved = this.methodCache.called(itemAsMethod);

            const node = isProperty(resolved)
              ? this.addProperty(resolved)
              : this.nodeFromMethod(resolved);

            this.addEdgeBasedOnBindingType(tagNode, node, binding.bindingType);
            //regular property
          } else {
            const item = {
              ...binding.item,
              id: identifiers.prefixThis(binding.item.id),
            };
            const last = this.addProperty(item);
            this.addEdgeBasedOnBindingType(tagNode, last, binding.bindingType);
          }
        }
        if (isMethod(binding.item)) {
          const resolved = this.methodCache.called({
            ...binding.item,
            id: identifiers.prefixThis(binding.item.id),
            args: binding.item.args.map((x) => {
              return { ...x, id: identifiers.prefixThis(x.id) };
            }),
          });
          const node = isProperty(resolved)
            ? this.addProperty(resolved)
            : this.nodeFromMethod(resolved);
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
  }

  private addEdgesForNumerics() {
    const numericIndexDataNodes = this.graph.numericIndexDataNodes();
    const parents = _.flatMap((x) => lift(x.parent), numericIndexDataNodes).map(
      (x) => this.graph.node(x) as DataNode
    );
    const parentsUniq = _.uniqWith(_.isEqual, parents);
    parentsUniq.forEach((x) => this.connectEdgesOfGenericToNumeric(x));
  }
  //#endregion

  //#region Helper Methods
  private isComputedProperty(item: identifiers.Identifiers): boolean {
    return _.find(_.isEqual(item), this.computedIds) !== undefined;
  }
  private isInit(item: identifiers.Identifiers): boolean {
    return _.equals(this.init?.id, item);
  }

  /**
   * Adds nodes for each identifier in identifiers, connects them, and returns the last one added
   * @param ids identifiers
   */
  private addProperty(id: Property, isWrite = false): Node {
    const nodes = isWrite
      ? this.identifiersToDataNodesWrite(id.id)
      : this.identifiersToDataNodes(id.id);

    this.graph.addNodes(nodes);
    this.graph.connect(nodes);

    const last = _.last(nodes);
    if (!last)
      throw new Error("Got empty identifier. this should not be possible");
    return last;
  }

  //#endregion

  //#region Edges

  private connect(
    source: DataNode | undefined,
    sink: DataNode | undefined
  ): void {
    if (source && sink) {
      this.graph.addEdge({
        source,
        sink,
        label: EdgeType.SIMPLE,
      });
    }
  }
  private connectEdgesOfGenericToNumeric(node: DataNode): void {
    const allNumeric = this.graph.numericChildren(node);
    const generic = this.graph.genericChildNode(node);

    allNumeric.forEach((numeric) => {
      // numeric -> generic
      this.connect(numeric, generic);
      // numeric.a.b.c -> generic.a.b.c
      this.connectChildren(numeric, generic);
      //// node.a.b.c -> nmeric.a.b.c
      this.connectChildren(node, numeric);
    });
  }

  private connectChildren(
    numeric: DataNode | undefined,
    generic: DataNode | undefined
  ): void {
    if (!numeric || !generic) return;

    const childrenOfNumeric = this.graph.nameChildren(numeric);
    const childrenOfGeneric = this.graph.nameChildren(generic);

    if (!childrenOfGeneric || !childrenOfNumeric) return;

    const childrenOfGenericNames = childrenOfGeneric.map((x) => x.name);

    const paired = childrenOfGenericNames.map((name) => {
      return {
        numeric: _.find((x) => _.isEqual(name, x.name), childrenOfNumeric),
        generic: _.find((x) => _.isEqual(name, x.name), childrenOfGeneric),
      };
    });

    paired.forEach((x) => {
      this.connect(x.numeric, x.generic);
      this.connectChildren(x.numeric, x.generic);
    });
  }

  /**
   * Adds a new edge with the correct type for the given binding.
   * @param tag tag node
   * @param item  binding node
   * @param type binding type
   */
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

  private addEdgesMethod(
    node: Node,
    resolved: ResolvedMethodDefintition
  ): void {
    const readNodes = resolved.reads.map((x) => this.addProperty(x));
    readNodes.forEach((source) =>
      this.graph.addEdge({ source, sink: node, label: EdgeType.SIMPLE })
    );

    const writeNodes = resolved.writes.map((x) => this.addProperty(x, true));
    writeNodes.forEach((sink) =>
      this.graph.addEdge({ source: node, sink, label: EdgeType.SIMPLE })
    );

    const callNodes = resolved.calls.map((x) => this.nodeFromMethod(x));
    callNodes.forEach((sink) =>
      this.graph.addEdge({ source: node, sink, label: EdgeType.CALLS })
    );
  }

  //#endregion

  //#region Nodes from identifiers (including args for methods)

  /**
   * Create data nodes from identifiers
   * @param ids identifiers
   */
  private identifiersToDataNodes(ids: Identifiers): DataNode[] {
    let prev: Identifier[] = [];
    let lastName = "";
    const nodes = ids.map((current) => {
      const name = identifier.isIndex(current)
        ? lastName + identifier.render(current)
        : identifier.render(current);

      const parent = prev.length == 0 ? undefined : identifiers.render(prev);
      prev = prev.concat(current);

      lastName = name;
      const node: DataNode = {
        id: identifiers.render(prev),
        type: current.discriminator,
        name,
        parent,

        discriminator: NodeType.DATA,
      };
      return node;
    });
    return nodes;
  }

  private identifiersToDataNodesWrite(ids: Identifiers): DataNode[] {
    const noGeneric = ids.filter((x) => !identifier.isGenericIndex(x));
    return this.identifiersToDataNodes(noGeneric);
  }

  /**
   * Creates a node from the given method definition, based on it's id and args.
   * If it's a computed property, brackets are ommited.
   * Note that this creates no edges, only the node for the method itself
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
        if (isProperty(arg)) {
          const last = _.last(this.identifiersToDataNodes(arg.id));
          return last ? last.id : "";
        }
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
  //#endregion
}
