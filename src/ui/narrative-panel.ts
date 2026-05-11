import type { FlagSnapshot, PresentedNode } from "../narrative/types";

export type ChoiceHandler = (choiceId: string) => void;

type RenderablePresentedNode = Omit<PresentedNode, "flags"> & {
  flags?: PresentedNode["flags"];
};

const STAT_MINIMUM = 1;
const STAT_MAXIMUM = 10;
const STAT_NEUTRAL = 5;

const VISIBLE_STAT_DEFINITIONS = [
  {
    flag: "cansancio_energia",
    label: "Energía",
    lowLabel: "Cansancio",
    highLabel: "Energía",
  },
  {
    flag: "ansiedad_tranquilidad",
    label: "Tranquilidad",
    lowLabel: "Ansiedad",
    highLabel: "Tranquilidad",
  },
] as const;

export class NarrativePanel {
  private readonly rootElement: HTMLElement;
  private readonly slotElement: HTMLDivElement;
  private readonly titleElement: HTMLHeadingElement;
  private readonly bodyElement: HTMLDivElement;
  private readonly questionElement: HTMLParagraphElement;
  private readonly notificationElement: HTMLDivElement;
  private readonly statsElement: HTMLDivElement;
  private readonly choicesElement: HTMLDivElement;
  private readonly panelElement: HTMLElement;
  private availableChoices: PresentedNode["choices"] = [];
  private choiceHandler: ChoiceHandler | null = null;
  private previousFlags: FlagSnapshot | null = null;
  private selectedChoiceIndex = 0;

  constructor(parent: HTMLElement) {
    this.rootElement = parent;
    this.rootElement.className = "narrative-ui";

    this.slotElement = document.createElement("div");
    this.slotElement.className = "narrative-slot";

    this.panelElement = document.createElement("section");
    this.panelElement.className = "narrative-panel";
    this.panelElement.setAttribute("aria-live", "polite");

    const copyElement = document.createElement("div");
    copyElement.className = "narrative-panel__copy";

    this.titleElement = document.createElement("h1");
    this.titleElement.className = "narrative-panel__title";

    this.bodyElement = document.createElement("div");
    this.bodyElement.className = "narrative-panel__body";

    this.questionElement = document.createElement("p");
    this.questionElement.className = "narrative-panel__question";

    this.notificationElement = document.createElement("div");
    this.notificationElement.className = "stat-notification";
    this.notificationElement.setAttribute("aria-live", "polite");

    this.statsElement = document.createElement("div");
    this.statsElement.className = "narrative-panel__stats";
    this.statsElement.setAttribute("aria-label", "Estadísticas");

    this.choicesElement = document.createElement("div");
    this.choicesElement.className = "narrative-panel__choices";

    copyElement.append(
      this.titleElement,
      this.bodyElement,
      this.questionElement,
    );
    this.panelElement.append(copyElement, this.choicesElement);
    this.slotElement.replaceChildren(this.panelElement);
    this.rootElement.replaceChildren(this.statsElement, this.notificationElement, this.slotElement);
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }

  onChoice(handler: ChoiceHandler): void {
    this.choiceHandler = handler;
  }

  render(presentedNode: RenderablePresentedNode): void {
    const displayMode = presentedNode.displayMode ?? "story";
    const availableChoices = presentedNode.choices.filter((choice) => choice.isAvailable);
    const hasMultipleChoices = availableChoices.length > 1;
    this.rootElement.className = [
      "narrative-ui",
      `narrative-ui--${displayMode}`,
      hasMultipleChoices ? "narrative-ui--multiple-choices" : "",
    ]
      .filter(Boolean)
      .join(" ");
    this.slotElement.className = [
      "narrative-slot",
      `narrative-slot--${displayMode}`,
      hasMultipleChoices ? "narrative-slot--multiple-choices" : "",
    ]
      .filter(Boolean)
      .join(" ");
    this.panelElement.className = [
      "narrative-panel",
      `narrative-panel--${displayMode}`,
      hasMultipleChoices ? "narrative-panel--multiple-choices" : "",
    ]
      .filter(Boolean)
      .join(" ");
    this.panelElement.dataset.nodeId = presentedNode.id;
    this.titleElement.textContent = presentedNode.title;
    this.bodyElement.replaceChildren(
      ...presentedNode.lines.map((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        return paragraph;
      }),
    );
    this.questionElement.textContent = presentedNode.question ?? "";
    this.questionElement.hidden = !presentedNode.question;
    this.availableChoices = availableChoices;
    this.selectedChoiceIndex = 0;
    this.renderChoices(presentedNode);
    this.renderStats(presentedNode);
    this.renderStatNotification(presentedNode);
    this.updateSelectedChoice();
  }

  private renderChoices(presentedNode: RenderablePresentedNode): void {
    const choiceButtons = presentedNode.choices.map((choice) => {
      const button = document.createElement("button");
      button.className = "narrative-panel__choice";
      button.type = "button";
      button.disabled = !choice.isAvailable;
      button.dataset.choiceId = choice.id;
      button.replaceChildren(document.createTextNode(choice.text));
      button.addEventListener("click", () => this.handleChoiceClick(choice.id));
      button.addEventListener("mouseenter", () => this.selectChoiceById(choice.id));
      return button;
    });

    this.choicesElement.replaceChildren();
    this.choicesElement.append(...choiceButtons);
  }

  private renderStats(presentedNode: RenderablePresentedNode): void {
    const displayMode = presentedNode.displayMode ?? "story";
    const shouldShowStats =
      presentedNode.showStats ?? (displayMode === "story" || displayMode === "ending");
    const flags = presentedNode.flags ?? {};

    if (!shouldShowStats || Object.keys(flags).length === 0) {
      this.statsElement.hidden = true;
      this.statsElement.replaceChildren();
      this.previousFlags = { ...flags };
      return;
    }

    const statElements = VISIBLE_STAT_DEFINITIONS.flatMap((statDefinition) => {
      const rawValue = flags[statDefinition.flag];

      if (typeof rawValue !== "number") {
        return [];
      }

      const statElement = document.createElement("div");
      statElement.className = "narrative-panel__stat";
      statElement.dataset.state = this.getStatState(rawValue);

      const statHeader = document.createElement("div");
      statHeader.className = "narrative-panel__stat-header";

      const statLabel = document.createElement("span");
      statLabel.className = "narrative-panel__stat-label";
      statLabel.textContent = statDefinition.label;

      const statValue = document.createElement("span");
      statValue.className = "narrative-panel__stat-value";
      statValue.textContent = `${rawValue}`;

      const statTrack = document.createElement("div");
      statTrack.className = "narrative-panel__stat-track";
      statTrack.setAttribute(
        "aria-label",
        `${statDefinition.lowLabel} ${STAT_MINIMUM}, neutral ${STAT_NEUTRAL}, ${statDefinition.highLabel} ${STAT_MAXIMUM}. Valor actual ${rawValue}.`,
      );

      const statFill = document.createElement("div");
      statFill.className = "narrative-panel__stat-fill";
      statFill.style.width = `${this.getStatFillPercentage(rawValue)}%`;

      statHeader.append(statLabel, statValue);
      statTrack.append(statFill);
      statElement.append(statHeader, statTrack);
      return [statElement];
    });

    this.statsElement.hidden = statElements.length === 0;
    this.statsElement.replaceChildren(...statElements);
  }

  private renderStatNotification(presentedNode: RenderablePresentedNode): void {
    const displayMode = presentedNode.displayMode ?? "story";
    const shouldShowStats =
      presentedNode.showStats ?? (displayMode === "story" || displayMode === "ending");
    const currentFlags = presentedNode.flags ?? {};

    if (!shouldShowStats) {
      this.notificationElement.replaceChildren();
      this.notificationElement.hidden = true;
      this.previousFlags = { ...currentFlags };
      return;
    }

    const changedStats = VISIBLE_STAT_DEFINITIONS.flatMap((statDefinition) => {
      const currentValue = currentFlags[statDefinition.flag];
      const previousValue = this.previousFlags?.[statDefinition.flag];

      if (typeof currentValue !== "number" || typeof previousValue !== "number") {
        return [];
      }

      const delta = currentValue - previousValue;

      if (delta === 0) {
        return [];
      }

      const notificationChip = document.createElement("span");
      notificationChip.className = "stat-notification__chip";
      notificationChip.dataset.state = delta < 0 ? "negative" : "positive";
      notificationChip.textContent = `${statDefinition.label} ${delta > 0 ? "+" : ""}${delta}`;
      return [notificationChip];
    });

    this.previousFlags = { ...currentFlags };

    if (changedStats.length === 0) {
      this.notificationElement.replaceChildren();
      this.notificationElement.hidden = true;
      return;
    }

    this.notificationElement.hidden = false;
    this.notificationElement.replaceChildren(...changedStats);
    this.notificationElement.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 1, transform: "translateY(0)", offset: 0.72 },
        { opacity: 0, transform: "translateY(-8px)" },
      ],
      {
        duration: 1900,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    );
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
      return;
    }

    if (this.availableChoices.length === 0) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % this.availableChoices.length;
      this.updateSelectedChoice();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedChoiceIndex =
        (this.selectedChoiceIndex - 1 + this.availableChoices.length) % this.availableChoices.length;
      this.updateSelectedChoice();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const selectedChoice = this.availableChoices[this.selectedChoiceIndex];

      if (selectedChoice) {
        this.choiceHandler?.(selectedChoice.id);
      }
    }
  }

  private handleChoiceClick(choiceId: string): void {
    const isCurrentAvailableChoice = this.availableChoices.some((choice) => choice.id === choiceId);

    if (!isCurrentAvailableChoice) {
      return;
    }

    this.choiceHandler?.(choiceId);
  }

  private selectChoiceById(choiceId: string): void {
    const nextIndex = this.availableChoices.findIndex((choice) => choice.id === choiceId);

    if (nextIndex === -1) {
      return;
    }

    this.selectedChoiceIndex = nextIndex;
    this.updateSelectedChoice();
  }

  private updateSelectedChoice(): void {
    const selectedChoice = this.availableChoices[this.selectedChoiceIndex];

    for (const button of this.choicesElement.querySelectorAll<HTMLButtonElement>(
      ".narrative-panel__choice",
    )) {
      button.dataset.selected = selectedChoice?.id === button.dataset.choiceId ? "true" : "false";
    }
  }

  private getStatState(value: number): "negative" | "neutral" | "positive" {
    if (value < STAT_NEUTRAL) {
      return "negative";
    }

    if (value > STAT_NEUTRAL) {
      return "positive";
    }

    return "neutral";
  }

  private getStatFillPercentage(value: number): number {
    const clampedValue = Math.min(STAT_MAXIMUM, Math.max(STAT_MINIMUM, value));
    return (clampedValue / STAT_MAXIMUM) * 100;
  }
}
