import { FlagStore } from "./FlagStore";
import type {
  ChoiceEffect,
  FlagCondition,
  PresentedNode,
  StoryNode,
  StorySnapshot,
} from "./types";

export class StoryRunner {
  private readonly nodesById = new Map<string, StoryNode>();
  private currentNode: StoryNode;
  private lastEffectText: string | null = null;

  constructor(
    nodes: StoryNode[],
    startNodeId: string,
    private readonly flagStore = new FlagStore(),
  ) {
    if (nodes.length === 0) {
      throw new Error("StoryRunner requires at least one story node.");
    }

    for (const node of nodes) {
      if (this.nodesById.has(node.id)) {
        throw new Error(`Duplicate story node id "${node.id}".`);
      }

      this.nodesById.set(node.id, node);
    }

    const startNode = this.nodesById.get(startNodeId);
    if (!startNode) {
      throw new Error(`Start node "${startNodeId}" does not exist.`);
    }

    this.currentNode = startNode;
    this.applyEffects(this.currentNode.onEnter ?? []);
  }

  presentNode(): PresentedNode {
    return {
      ...this.currentNode,
      choices: this.currentNode.choices.map((choice) => ({
        ...choice,
        isAvailable: this.conditionsAreMet(choice.conditions ?? []),
      })),
      lastEffectText: this.lastEffectText,
      flags: this.flagStore.toJSON(),
    };
  }

  choose(choiceId: string): PresentedNode {
    const choice = this.currentNode.choices.find((candidate) => candidate.id === choiceId);

    if (!choice) {
      throw new Error(`Choice "${choiceId}" is not available on node "${this.currentNode.id}".`);
    }

    if (!this.conditionsAreMet(choice.conditions ?? [])) {
      throw new Error(`Choice "${choiceId}" does not meet its conditions.`);
    }

    const nextNode = this.nodesById.get(choice.nextNodeId);
    if (!nextNode) {
      throw new Error(`Choice "${choiceId}" points to missing node "${choice.nextNodeId}".`);
    }

    this.applyEffects(this.currentNode.onLeave ?? []);
    this.applyEffects(choice.effects ?? []);
    this.lastEffectText = this.normalizeEffectText(choice.effectText);
    this.currentNode = nextNode;
    this.applyEffects(this.currentNode.onEnter ?? []);

    return this.presentNode();
  }

  getSnapshot(): StorySnapshot {
    const presentedNode = this.presentNode();

    return {
      currentNodeId: this.currentNode.id,
      currentNodeTitle: this.currentNode.title,
      displayMode: this.currentNode.displayMode ?? "story",
      availableChoiceIds: presentedNode.choices
        .filter((choice) => choice.isAvailable)
        .map((choice) => choice.id),
      flags: this.flagStore.toJSON(),
      lastEffectText: this.lastEffectText,
      ending: this.computeEnding(),
    };
  }

  computeEnding(): string {
    return this.currentNode.displayMode === "ending" ? this.currentNode.id : "NONE";
  }

  private conditionsAreMet(conditions: FlagCondition[]): boolean {
    return conditions.every((condition) => this.conditionIsMet(condition));
  }

  private conditionIsMet(condition: FlagCondition): boolean {
    const value = this.flagStore.get(condition.flag);

    if ("equals" in condition) {
      return value === condition.equals;
    }

    if ("notEquals" in condition) {
      return value !== condition.notEquals;
    }

    if ("exists" in condition) {
      return this.flagStore.has(condition.flag);
    }

    if ("gte" in condition) {
      return typeof value === "number" && value >= condition.gte;
    }

    return typeof value === "number" && value <= condition.lte;
  }

  private applyEffects(effects: ChoiceEffect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case "setFlag":
          this.flagStore.set(effect.flag, effect.value);
          break;
        case "incrementFlag":
          this.flagStore.increment(effect.flag, effect.amount ?? 1);
          break;
        case "adjustNumberFlag":
          this.flagStore.adjustNumber(effect.flag, effect.amount, {
            min: effect.min,
            max: effect.max,
          });
          break;
        case "toggleFlag":
          this.flagStore.toggle(effect.flag);
          break;
        default:
          this.assertNever(effect);
      }
    }
  }

  private assertNever(effect: never): never {
    throw new Error(`Unsupported story effect: ${JSON.stringify(effect)}`);
  }

  private normalizeEffectText(effectText: string | undefined): string | null {
    const normalizedText = effectText?.trim();
    return normalizedText ? normalizedText : null;
  }
}
