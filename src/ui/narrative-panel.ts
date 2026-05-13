import type { Timeline } from "animejs";
import type { FlagSnapshot, PresentedNode } from "../narrative/types";
import { cancelTypewriterTimeline, playPanelTypewriter } from "./typewriter";

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
  },
  {
    flag: "ansiedad_tranquilidad",
    label: "Tranquilidad",
  },
  {
    flag: "confianza",
    label: "Confianza",
  },
  {
    flag: "reputacion",
    label: "Reputación",
  },
] as const;

export class NarrativePanel {
  private readonly rootElement: HTMLElement;
  private readonly slotElement: HTMLDivElement;
  private readonly copyElement: HTMLDivElement;
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
  private statNotificationAnimationEnd: ((event: AnimationEvent) => void) | null = null;
  private narrativeTypewriterTimeline: Timeline | null = null;
  private narrativeTypingActive = false;

  constructor(parent: HTMLElement) {
    this.rootElement = parent;
    this.rootElement.className = "narrative-ui";

    this.slotElement = document.createElement("div");
    this.slotElement.className = "narrative-slot";

    this.panelElement = document.createElement("section");
    this.panelElement.className = "narrative-panel";
    this.panelElement.setAttribute("aria-live", "polite");

    this.copyElement = document.createElement("div");
    this.copyElement.className = "narrative-panel__copy";

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

    this.copyElement.append(
      this.titleElement,
      this.bodyElement,
      this.questionElement,
    );
    this.panelElement.append(this.copyElement, this.choicesElement);
    this.slotElement.replaceChildren(this.panelElement);
    this.rootElement.replaceChildren(this.statsElement, this.notificationElement, this.slotElement);
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }

  onChoice(handler: ChoiceHandler): void {
    this.choiceHandler = handler;
  }

  render(presentedNode: RenderablePresentedNode): void {
    this.stopNarrativeTypewriter();

    const displayMode = presentedNode.displayMode ?? "story";
    const availableChoices = presentedNode.choices.filter((choice) => choice.isAvailable);
    const hasMultipleChoices = availableChoices.length > 1;
    const useTypewriter = displayMode === "story" || displayMode === "ending";
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

    if (useTypewriter) {
      this.titleElement.textContent = "";
      this.bodyElement.replaceChildren(
        ...presentedNode.lines.map(() => {
          const paragraph = document.createElement("p");
          paragraph.textContent = "";
          return paragraph;
        }),
      );
      this.questionElement.textContent = presentedNode.question ? "" : "";
      this.questionElement.hidden = !presentedNode.question;
    } else {
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
    }

    this.availableChoices = availableChoices;
    this.selectedChoiceIndex = 0;
    this.applyTextDensity(presentedNode, availableChoices);
    const choiceTypeSegments = this.renderChoices(presentedNode, useTypewriter);
    this.renderStats(presentedNode);
    this.renderStatNotification(presentedNode);
    this.updateSelectedChoice();
    this.rootElement.hidden = displayMode === "chapter";

    if (!useTypewriter) {
      this.fitPanelText();
      return;
    }

    const sequential: Array<{ element: HTMLElement; text: string }> = [
      { element: this.titleElement, text: presentedNode.title },
      ...presentedNode.lines.map((line, index) => {
        const paragraph = this.bodyElement.children[index];

        if (!(paragraph instanceof HTMLParagraphElement)) {
          throw new Error("Narrative body paragraph missing for typewriter.");
        }

        return { element: paragraph, text: line };
      }),
    ];

    if (presentedNode.question) {
      sequential.push({ element: this.questionElement, text: presentedNode.question });
    }

    this.narrativeTypingActive = true;

    for (const segment of choiceTypeSegments) {
      segment.element.disabled = true;
    }

    this.narrativeTypewriterTimeline = playPanelTypewriter({
      sequential,
      parallelAfter: choiceTypeSegments,
      onComplete: () => {
        this.narrativeTypewriterTimeline = null;
        this.narrativeTypingActive = false;
        this.applyChoiceAvailabilityToButtons(presentedNode);
        this.fitPanelText();
      },
    });
  }

  private applyTextDensity(
    presentedNode: RenderablePresentedNode,
    availableChoices: PresentedNode["choices"],
  ): void {
    const totalTextLength =
      presentedNode.title.length +
      presentedNode.lines.reduce((total, line) => total + line.length, 0) +
      (presentedNode.question?.length ?? 0) +
      availableChoices.reduce((total, choice) => total + choice.text.length, 0);
    const textLineCount =
      1 + presentedNode.lines.length + (presentedNode.question ? 1 : 0) + availableChoices.length;
    const density =
      totalTextLength > 280 || textLineCount >= 7
        ? "tight"
        : totalTextLength > 190 || textLineCount >= 5
          ? "compact"
          : "normal";

    this.panelElement.dataset.density = density;
    this.panelElement.dataset.overflow = "false";
  }

  private fitPanelText(): void {
    requestAnimationFrame(() => {
      this.panelElement.dataset.overflow = "false";

      if (!this.panelContentOverflows()) {
        return;
      }

      if (this.panelElement.dataset.density === "normal") {
        this.panelElement.dataset.density = "compact";
      } else if (this.panelElement.dataset.density === "compact") {
        this.panelElement.dataset.density = "tight";
      }

      requestAnimationFrame(() => {
        if (this.panelContentOverflows() && this.panelElement.dataset.density === "compact") {
          this.panelElement.dataset.density = "tight";
        }

        requestAnimationFrame(() => {
          this.panelElement.dataset.overflow = this.panelContentOverflows() ? "scroll" : "false";
        });
      });
    });
  }

  private panelContentOverflows(): boolean {
    const panelOverflow = this.panelElement.scrollHeight > this.panelElement.clientHeight + 1;
    const copyOverflow = this.copyElement.scrollHeight > this.copyElement.clientHeight + 1;
    const choicesOverflow = this.choicesElement.scrollHeight > this.choicesElement.clientHeight + 1;
    return panelOverflow || copyOverflow || choicesOverflow;
  }

  private stopNarrativeTypewriter(): void {
    cancelTypewriterTimeline(this.narrativeTypewriterTimeline);
    this.narrativeTypewriterTimeline = null;
    this.narrativeTypingActive = false;
  }

  private applyChoiceAvailabilityToButtons(presentedNode: RenderablePresentedNode): void {
    for (const button of this.choicesElement.querySelectorAll<HTMLButtonElement>(
      ".narrative-panel__choice",
    )) {
      const choiceId = button.dataset.choiceId;
      const choice = presentedNode.choices.find((item) => item.id === choiceId);

      if (choice) {
        button.disabled = !choice.isAvailable;
      }
    }
  }

  private renderChoices(
    presentedNode: RenderablePresentedNode,
    deferAvailableLabels: boolean,
  ): Array<{ element: HTMLButtonElement; text: string }> {
    const choiceTypeSegments: Array<{ element: HTMLButtonElement; text: string }> = [];

    const choiceButtons = presentedNode.choices.map((choice) => {
      const button = document.createElement("button");
      button.className = "narrative-panel__choice";
      button.type = "button";
      button.disabled = !choice.isAvailable;
      button.dataset.choiceId = choice.id;

      if (deferAvailableLabels && choice.isAvailable) {
        button.replaceChildren(document.createTextNode(""));
        choiceTypeSegments.push({ element: button, text: choice.text });
      } else {
        button.replaceChildren(document.createTextNode(choice.text));
      }

      button.addEventListener("click", () => this.handleChoiceClick(choice.id));
      button.addEventListener("mouseenter", () => this.selectChoiceById(choice.id));
      return button;
    });

    this.choicesElement.replaceChildren();
    this.choicesElement.append(...choiceButtons);
    return choiceTypeSegments;
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

      const clampedValue = this.getClampedStatValue(rawValue);
      const statElement = document.createElement("div");
      statElement.className = "narrative-panel__stat";
      statElement.dataset.state = this.getStatState(clampedValue);

      const statHeader = document.createElement("div");
      statHeader.className = "narrative-panel__stat-header";

      const statLabel = document.createElement("span");
      statLabel.className = "narrative-panel__stat-label";
      statLabel.textContent = statDefinition.label;

      const statTrack = document.createElement("div");
      statTrack.className = "narrative-panel__stat-track";
      statTrack.setAttribute(
        "aria-label",
        `${statDefinition.label}: ${this.getStatStateLabel(clampedValue)}.`,
      );

      const statFill = document.createElement("div");
      statFill.className = "narrative-panel__stat-fill";
      statFill.style.width = `${this.getStatFillPercentage(clampedValue)}%`;

      statHeader.append(statLabel);
      statTrack.append(statFill);
      statElement.append(statHeader, statTrack);
      return [statElement];
    });

    this.statsElement.hidden = statElements.length === 0;
    const statsHeading = document.createElement("div");
    statsHeading.className = "narrative-panel__stats-heading";

    const statsTitle = document.createElement("span");
    statsTitle.textContent = "ESTADO";

    statsHeading.append(statsTitle);
    this.statsElement.replaceChildren(statsHeading, ...statElements);
  }

  private renderStatNotification(presentedNode: RenderablePresentedNode): void {
    const displayMode = presentedNode.displayMode ?? "story";
    const shouldShowStats =
      presentedNode.showStats ?? (displayMode === "story" || displayMode === "ending");
    const currentFlags = presentedNode.flags ?? {};

    if (!shouldShowStats) {
      this.teardownStatNotificationAnimation(true);
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
      this.teardownStatNotificationAnimation(true);
      return;
    }

    this.teardownStatNotificationAnimation(false);

    this.notificationElement.hidden = false;
    this.notificationElement.replaceChildren(...changedStats);

    for (let index = 0; index < changedStats.length; index += 1) {
      const chip = changedStats[index];
      chip.style.setProperty("--chip-index", String(index));
    }

    let pendingEnds = changedStats.length;
    this.statNotificationAnimationEnd = (event: AnimationEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("stat-notification__chip")) {
        return;
      }

      pendingEnds -= 1;

      if (pendingEnds > 0) {
        return;
      }

      if (this.statNotificationAnimationEnd) {
        this.notificationElement.removeEventListener("animationend", this.statNotificationAnimationEnd);
        this.statNotificationAnimationEnd = null;
      }

      this.notificationElement.classList.remove("stat-notification--playing");
      this.notificationElement.replaceChildren();
      this.notificationElement.hidden = true;
    };

    this.notificationElement.addEventListener("animationend", this.statNotificationAnimationEnd);

    requestAnimationFrame(() => {
      this.notificationElement.classList.add("stat-notification--playing");
    });
  }

  private teardownStatNotificationAnimation(resetDom: boolean): void {
    if (this.statNotificationAnimationEnd) {
      this.notificationElement.removeEventListener("animationend", this.statNotificationAnimationEnd);
      this.statNotificationAnimationEnd = null;
    }

    this.notificationElement.classList.remove("stat-notification--playing");

    if (resetDom) {
      this.notificationElement.replaceChildren();
      this.notificationElement.hidden = true;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.rootElement.hidden) {
      return;
    }

    if (this.narrativeTypingActive) {
      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
      }

      return;
    }

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
    if (this.narrativeTypingActive) {
      return;
    }

    const isCurrentAvailableChoice = this.availableChoices.some((choice) => choice.id === choiceId);

    if (!isCurrentAvailableChoice) {
      return;
    }

    this.choiceHandler?.(choiceId);
  }

  private selectChoiceById(choiceId: string): void {
    if (this.narrativeTypingActive) {
      return;
    }

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

  private getStatStateLabel(value: number): "baja" | "estable" | "alta" {
    if (value < STAT_NEUTRAL) {
      return "baja";
    }

    if (value > STAT_NEUTRAL) {
      return "alta";
    }

    return "estable";
  }

  private getClampedStatValue(value: number): number {
    return Math.min(STAT_MAXIMUM, Math.max(STAT_MINIMUM, value));
  }

  private getStatFillPercentage(value: number): number {
    const clampedValue = this.getClampedStatValue(value);
    return (clampedValue / STAT_MAXIMUM) * 100;
  }
}
