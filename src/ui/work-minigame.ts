export type WorkMinigameOutcome = "clean" | "strained" | "failed";

export type WorkMinigameSnapshot = {
  isActive: boolean;
  taskIndex: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentTaskTitle: string | null;
  expectedText: string | null;
  typedText: string;
  timeRemainingMs: number;
  inputMatchesExpectedPrefix: boolean;
};

declare global {
  interface Window {
    getWorkMinigameSnapshot?: () => WorkMinigameSnapshot;
  }
}

type WorkTask = {
  id: string;
  title: string;
  ticket: string;
  url: string;
  browserHeading: string;
  browserCopy: string;
  expected: string;
  timeLimitMs: number;
};

type WorkMinigameElements = {
  root: HTMLDivElement;
  taskLabel: HTMLSpanElement;
  timerLabel: HTMLSpanElement;
  timerFill: HTMLDivElement;
  progressLabel: HTMLSpanElement;
  progressFill: HTMLDivElement;
  browserTitle: HTMLHeadingElement;
  browserCopy: HTMLParagraphElement;
  browserAddress: HTMLDivElement;
  browserCode: HTMLDivElement;
  terminalWindow: HTMLDivElement;
  terminalStatus: HTMLSpanElement;
  terminalPrompt: HTMLSpanElement;
  editor: HTMLTextAreaElement;
};

const WORK_TASKS: WorkTask[] = [
  {
    id: "saludo",
    title: "Funcion de saludo",
    ticket: "TICKET 143",
    url: "intranet.local/php/ticket-143",
    browserHeading: "saludo($nombre)",
    browserCopy: "La intranet espera una funcion pequena para armar el saludo del turno.",
    expected: `<?php
function saludo($nombre) {
    return "Hola, " . $nombre;
}
?>`,
    timeLimitMs: 30000,
  },
  {
    id: "iva",
    title: "Calculo de impuesto",
    ticket: "TICKET 217",
    url: "intranet.local/php/ticket-217",
    browserHeading: "precioConIva($precio)",
    browserCopy: "Ventas necesita una funcion simple que devuelva el precio con IVA.",
    expected: `<?php
function precioConIva($precio) {
    return $precio * 1.21;
}
?>`,
    timeLimitMs: 34000,
  },
  {
    id: "prioridad",
    title: "Estado del ticket",
    ticket: "TICKET 302",
    url: "intranet.local/php/ticket-302",
    browserHeading: "estadoTicket($prioridad)",
    browserCopy: "Soporte pide clasificar tickets con prioridad mayor a 3 como urgentes.",
    expected: `<?php
function estadoTicket($prioridad) {
    if ($prioridad > 3) {
        return "urgente";
    }

    return "normal";
}
?>`,
    timeLimitMs: 48000,
  },
  {
    id: "horas",
    title: "Total de horas",
    ticket: "TICKET 411",
    url: "intranet.local/php/ticket-411",
    browserHeading: "totalHoras($horas)",
    browserCopy: "Recursos humanos manda un arreglo de horas y espera el total acumulado.",
    expected: `<?php
function totalHoras($horas) {
    $total = 0;

    foreach ($horas as $hora) {
        $total += $hora;
    }

    return $total;
}
?>`,
    timeLimitMs: 62000,
  },
];

const OUTCOME_CHOICE_IDS: Record<WorkMinigameOutcome, string> = {
  clean: "finish_work_shift_clean",
  strained: "finish_work_shift_strained",
  failed: "finish_work_shift_failed",
};

export class WorkMinigameScreen {
  private elements: WorkMinigameElements | null = null;
  private taskIndex = 0;
  private completedTasks = 0;
  private failedTasks = 0;
  private taskDeadlineAt = 0;
  private active = false;
  private locked = false;
  private frameRequestId: number | null = null;
  private advanceTimeoutId: number | null = null;
  private onComplete: ((choiceId: string) => void) | null = null;

  constructor(private readonly parent: HTMLDivElement) {}

  mount(onComplete: (choiceId: string) => void): void {
    this.unmount();
    this.parent.className = "visual-placeholder visual-placeholder--work-minigame";
    this.parent.hidden = false;
    this.parent.replaceChildren();

    this.onComplete = onComplete;
    this.active = true;
    this.locked = false;
    this.taskIndex = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.elements = this.createShell();
    this.parent.append(this.elements.root);
    window.getWorkMinigameSnapshot = () => this.getSnapshot();
    this.renderTask();
  }

  unmount(): void {
    this.stopTimer();

    if (this.advanceTimeoutId !== null) {
      window.clearTimeout(this.advanceTimeoutId);
      this.advanceTimeoutId = null;
    }

    this.active = false;
    this.locked = false;
    this.elements = null;
    this.onComplete = null;
    delete window.getWorkMinigameSnapshot;
  }

  private createShell(): WorkMinigameElements {
    const root = document.createElement("div");
    root.className = "work-minigame";
    root.setAttribute("data-testid", "work-minigame");

    const bezel = document.createElement("div");
    bezel.className = "work-minigame__bezel";

    const screen = document.createElement("div");
    screen.className = "work-minigame__screen";

    const header = document.createElement("header");
    header.className = "work-minigame__header";

    const taskLabel = document.createElement("span");
    taskLabel.className = "work-minigame__task-label";

    const pressurePanel = document.createElement("div");
    pressurePanel.className = "work-minigame__pressure";

    const timerLabel = document.createElement("span");
    timerLabel.className = "work-minigame__timer-label";

    const timerTrack = document.createElement("div");
    timerTrack.className = "work-minigame__bar";

    const timerFill = document.createElement("div");
    timerFill.className = "work-minigame__bar-fill";
    timerTrack.append(timerFill);

    const progressLabel = document.createElement("span");
    progressLabel.className = "work-minigame__progress-label";

    const progressTrack = document.createElement("div");
    progressTrack.className = "work-minigame__bar work-minigame__bar--progress";

    const progressFill = document.createElement("div");
    progressFill.className = "work-minigame__bar-fill";
    progressTrack.append(progressFill);
    pressurePanel.append(timerLabel, timerTrack, progressLabel, progressTrack);
    header.append(taskLabel, pressurePanel);

    const desktop = document.createElement("section");
    desktop.className = "work-minigame__desktop";

    const terminalWindow = document.createElement("div");
    terminalWindow.className = "work-window work-window--terminal";

    const terminalChrome = document.createElement("div");
    terminalChrome.className = "work-window__chrome";

    const terminalTitle = document.createElement("span");
    terminalTitle.textContent = "terminal";

    const terminalStatus = document.createElement("span");
    terminalStatus.className = "work-window__status";
    terminalChrome.append(terminalTitle, terminalStatus);

    const terminalBody = document.createElement("div");
    terminalBody.className = "work-terminal";

    const terminalPrompt = document.createElement("span");
    terminalPrompt.className = "work-terminal__prompt";

    const editor = document.createElement("textarea");
    editor.className = "work-terminal__editor";
    editor.setAttribute("aria-label", "Terminal de trabajo");
    editor.setAttribute("data-testid", "work-terminal-editor");
    editor.spellcheck = false;
    editor.autocomplete = "off";
    editor.autocapitalize = "off";
    editor.wrap = "off";
    editor.addEventListener("input", () => this.handleEditorInput());
    editor.addEventListener("keydown", (event) => this.handleEditorKeyDown(event));
    terminalWindow.addEventListener("click", () => editor.focus({ preventScroll: true }));

    terminalBody.append(terminalPrompt, editor);
    terminalWindow.append(terminalChrome, terminalBody);

    const browserWindow = document.createElement("div");
    browserWindow.className = "work-window work-window--browser";

    const browserChrome = document.createElement("div");
    browserChrome.className = "work-browser__chrome";

    const browserDots = document.createElement("div");
    browserDots.className = "work-browser__dots";
    browserDots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));

    const browserAddress = document.createElement("div");
    browserAddress.className = "work-browser__address";
    browserChrome.append(browserDots, browserAddress);

    const browserBody = document.createElement("div");
    browserBody.className = "work-browser";

    const browserTitle = document.createElement("h2");
    browserTitle.className = "work-browser__title";

    const browserCopy = document.createElement("p");
    browserCopy.className = "work-browser__copy";

    const browserCode = document.createElement("div");
    browserCode.className = "work-browser__code";
    browserCode.setAttribute("data-testid", "work-reference-code");

    browserBody.append(browserTitle, browserCopy, browserCode);
    browserWindow.append(browserChrome, browserBody);
    desktop.append(terminalWindow, browserWindow);
    screen.append(header, desktop);
    bezel.append(screen);
    root.append(bezel);

    return {
      root,
      taskLabel,
      timerLabel,
      timerFill,
      progressLabel,
      progressFill,
      browserTitle,
      browserCopy,
      browserAddress,
      browserCode,
      terminalWindow,
      terminalStatus,
      terminalPrompt,
      editor,
    };
  }

  private renderTask(): void {
    const elements = this.requireElements();
    const task = this.getCurrentTask();

    this.locked = false;
    elements.root.dataset.state = "typing";
    elements.terminalWindow.dataset.input = "valid";
    elements.taskLabel.textContent = `${task.ticket} / ${task.title}`;
    elements.browserTitle.textContent = task.browserHeading;
    elements.browserCopy.textContent = task.browserCopy;
    elements.browserAddress.textContent = task.url;
    elements.terminalPrompt.textContent = `empleado@bordes:${task.id}$`;
    elements.terminalStatus.textContent = "ESPERANDO INPUT";
    elements.editor.value = "";
    elements.editor.disabled = false;
    elements.editor.maxLength = task.expected.length + 24;
    elements.progressLabel.textContent = `CODIGO 0/${task.expected.length}`;
    elements.progressFill.style.transform = "scaleX(0)";
    this.renderCodeReference(task);
    this.startTaskTimer();
    requestAnimationFrame(() => elements.editor.focus({ preventScroll: true }));
  }

  private renderCodeReference(task: WorkTask): void {
    const elements = this.requireElements();
    const rows = task.expected.split("\n").map((line, index) => {
      const row = document.createElement("div");
      row.className = "work-browser__code-row";

      const number = document.createElement("span");
      number.className = "work-browser__line-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const codeLine = document.createElement("code");
      codeLine.className = "work-browser__code-line";
      codeLine.textContent = line.length > 0 ? line : " ";

      row.append(number, codeLine);
      return row;
    });

    elements.browserCode.replaceChildren(...rows);
  }

  private startTaskTimer(): void {
    const now = performance.now();
    const task = this.getCurrentTask();
    this.taskDeadlineAt = now + task.timeLimitMs;
    this.renderTimer(task.timeLimitMs);
    this.stopTimer();
    this.frameRequestId = requestAnimationFrame(this.updateTimer);
  }

  private readonly updateTimer = (timestamp: number): void => {
    if (!this.active || this.locked) {
      return;
    }

    const remainingMs = Math.max(0, this.taskDeadlineAt - timestamp);
    this.renderTimer(remainingMs);

    if (remainingMs <= 0) {
      this.finishTask(false);
      return;
    }

    this.frameRequestId = requestAnimationFrame(this.updateTimer);
  };

  private renderTimer(remainingMs: number): void {
    const elements = this.requireElements();
    const task = this.getCurrentTask();
    const ratio = Math.max(0, Math.min(1, remainingMs / task.timeLimitMs));

    elements.timerLabel.textContent = `TIEMPO ${this.formatSeconds(remainingMs)}`;
    elements.timerFill.style.transform = `scaleX(${ratio})`;
    elements.root.dataset.pressure = ratio <= 0.24 ? "critical" : ratio <= 0.48 ? "warning" : "steady";
  }

  private handleEditorInput(): void {
    if (this.locked) {
      return;
    }

    const elements = this.requireElements();
    const task = this.getCurrentTask();
    const typedText = this.getTypedText();
    const isPrefix = task.expected.startsWith(typedText);
    const progress = Math.min(1, typedText.length / task.expected.length);

    elements.progressLabel.textContent = `CODIGO ${typedText.length}/${task.expected.length}`;
    elements.progressFill.style.transform = `scaleX(${progress})`;
    elements.terminalWindow.dataset.input = isPrefix ? "valid" : "error";
    elements.terminalStatus.textContent = isPrefix
      ? "SINCRONIZANDO"
      : `ERROR COL ${this.getFirstMismatchIndex(task.expected, typedText) + 1}`;

    if (typedText === task.expected) {
      this.finishTask(true);
    }
  }

  private handleEditorKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const elements = this.requireElements();
    const start = elements.editor.selectionStart;
    const end = elements.editor.selectionEnd;
    const insertedText = "    ";
    elements.editor.value = `${elements.editor.value.slice(0, start)}${insertedText}${elements.editor.value.slice(end)}`;
    elements.editor.selectionStart = start + insertedText.length;
    elements.editor.selectionEnd = start + insertedText.length;
    this.handleEditorInput();
  }

  private finishTask(success: boolean): void {
    if (this.locked) {
      return;
    }

    const elements = this.requireElements();
    this.locked = true;
    this.stopTimer();
    elements.editor.disabled = true;

    if (success) {
      this.completedTasks += 1;
      elements.root.dataset.state = "success";
      elements.terminalWindow.dataset.input = "valid";
      elements.terminalStatus.textContent = "COMPILADO";
    } else {
      this.failedTasks += 1;
      elements.root.dataset.state = "expired";
      elements.terminalWindow.dataset.input = "error";
      elements.terminalStatus.textContent = "TIEMPO AGOTADO";
    }

    this.advanceTimeoutId = window.setTimeout(() => {
      this.advanceTimeoutId = null;
      this.taskIndex += 1;

      if (this.taskIndex >= WORK_TASKS.length) {
        this.finishMinigame();
        return;
      }

      this.renderTask();
    }, success ? 520 : 860);
  }

  private finishMinigame(): void {
    const elements = this.requireElements();
    const outcome = this.getOutcome();
    const choiceId = OUTCOME_CHOICE_IDS[outcome];

    this.locked = true;
    this.stopTimer();
    elements.root.dataset.state = outcome;
    elements.root.dataset.pressure = "steady";
    elements.taskLabel.textContent = "TURNO CERRADO";
    elements.timerLabel.textContent = `OK ${this.completedTasks}/${WORK_TASKS.length}`;
    elements.progressLabel.textContent = `ERRORES ${this.failedTasks}`;
    elements.timerFill.style.transform = "scaleX(0)";
    elements.progressFill.style.transform = `scaleX(${this.completedTasks / WORK_TASKS.length})`;
    elements.terminalStatus.textContent = this.getOutcomeLabel(outcome);

    const result = document.createElement("div");
    result.className = "work-minigame__result";

    const title = document.createElement("strong");
    title.textContent = this.getOutcomeLabel(outcome);

    const details = document.createElement("span");
    details.textContent = `${this.completedTasks} tareas compiladas, ${this.failedTasks} vencidas.`;
    result.append(title, details);
    elements.root.append(result);

    this.advanceTimeoutId = window.setTimeout(() => {
      this.advanceTimeoutId = null;
      this.onComplete?.(choiceId);
    }, 1200);
  }

  private getOutcome(): WorkMinigameOutcome {
    if (this.completedTasks === WORK_TASKS.length && this.failedTasks === 0) {
      return "clean";
    }

    if (this.completedTasks >= Math.ceil(WORK_TASKS.length / 2)) {
      return "strained";
    }

    return "failed";
  }

  private getOutcomeLabel(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return "ENTREGA LIMPIA";
      case "strained":
        return "ENTREGA TENSIONADA";
      case "failed":
        return "ENTREGA FALLIDA";
      default:
        return this.assertNever(outcome);
    }
  }

  private getSnapshot(): WorkMinigameSnapshot {
    const task = this.active && this.taskIndex < WORK_TASKS.length ? this.getCurrentTask() : null;
    const typedText = this.elements ? this.getTypedText() : "";
    const timeRemainingMs =
      this.active && task && !this.locked ? Math.max(0, this.taskDeadlineAt - performance.now()) : 0;

    return {
      isActive: this.active,
      taskIndex: this.taskIndex,
      totalTasks: WORK_TASKS.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      currentTaskTitle: task?.title ?? null,
      expectedText: task?.expected ?? null,
      typedText,
      timeRemainingMs,
      inputMatchesExpectedPrefix: task ? task.expected.startsWith(typedText) : true,
    };
  }

  private getCurrentTask(): WorkTask {
    const task = WORK_TASKS[this.taskIndex];

    if (!task) {
      throw new Error(`Missing work task at index ${this.taskIndex}.`);
    }

    return task;
  }

  private getTypedText(): string {
    return this.requireElements().editor.value.replace(/\r\n/g, "\n");
  }

  private getFirstMismatchIndex(expected: string, typed: string): number {
    const length = Math.min(expected.length, typed.length);

    for (let index = 0; index < length; index += 1) {
      if (expected[index] !== typed[index]) {
        return index;
      }
    }

    return length;
  }

  private stopTimer(): void {
    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
  }

  private formatSeconds(milliseconds: number): string {
    return String(Math.ceil(milliseconds / 1000)).padStart(2, "0");
  }

  private requireElements(): WorkMinigameElements {
    if (!this.elements) {
      throw new Error("Work minigame elements are not mounted.");
    }

    return this.elements;
  }

  private assertNever(outcome: never): never {
    throw new Error(`Unsupported work minigame outcome: ${outcome}`);
  }
}
