export type WorkMinigameOutcome = "clean" | "strained" | "failed";

export type WorkMinigameSnapshot = {
  isActive: boolean;
  taskIndex: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalStrain: number;
  currentTaskMistakes: number;
  taskResults: WorkTaskResult[];
  currentTaskTitle: string | null;
  expectedText: string | null;
  typedText: string;
  timeRemainingMs: number;
  timeBonusPerCorrectCharacterMs: number;
  timePenaltyPerMistakeMs: number;
  inputMatchesExpectedPrefix: boolean;
  feedMessages: string[];
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
  startMessage: string;
  successMessage: string;
  timeoutMessage: string;
  pressureEvents: WorkPressureEvent[];
};

export type WorkTaskResult = "pending" | "active" | "success" | "failed";

type WorkPressureEvent = {
  triggerAtRatio: number;
  message: string;
  tone: WorkLogTone;
};

type WorkLogTone = "neutral" | "warning" | "error" | "success";

type WorkMinigameElements = {
  root: HTMLDivElement;
  taskLabel: HTMLSpanElement;
  timerLabel: HTMLSpanElement;
  timerFill: HTMLDivElement;
  progressLabel: HTMLSpanElement;
  progressFill: HTMLDivElement;
  strainLabel: HTMLSpanElement;
  strainFill: HTMLDivElement;
  queueList: HTMLDivElement;
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
    browserCopy: "La intranet espera una funcion corta para saludar al turno.",
    expected: `<?php
function saludo($nombre) {
    return "Hola, " . $nombre;
}
?>`,
    timeLimitMs: 36000,
    startMessage: "El primer ticket cae sin saludo. La sala no hace ruido, pero todos miran.",
    successMessage: "El saludo queda compilado. Nadie responde.",
    timeoutMessage: "El ticket de saludo queda abierto y empieza a molestar en la cola.",
    pressureEvents: [
      { triggerAtRatio: 0.66, message: "Intranet: el formulario no espera a nadie.", tone: "neutral" },
      { triggerAtRatio: 0.38, message: "Supervisor: cerra eso antes de que entren mas pedidos.", tone: "warning" },
      { triggerAtRatio: 0.18, message: "El cursor parpadea como una alarma muda.", tone: "error" },
    ],
  },
  {
    id: "horas",
    title: "Suma de horas",
    ticket: "TICKET 217",
    url: "intranet.local/php/ticket-217",
    browserHeading: "sumarHoras($hoy, $ayer)",
    browserCopy: "Administracion pide sumar dos cargas de horas antes del corte.",
    expected: `<?php
function sumarHoras($hoy, $ayer) {
    return $hoy + $ayer;
}
?>`,
    timeLimitMs: 38000,
    startMessage: "Administracion empuja el siguiente pedido. Nadie pregunta si estas listo.",
    successMessage: "La suma pasa. La cola baja por un segundo.",
    timeoutMessage: "Administracion reenvia el mismo pedido con asunto en mayusculas.",
    pressureEvents: [
      { triggerAtRatio: 0.7, message: "Correo interno: RE: RE: horas mal cargadas.", tone: "neutral" },
      { triggerAtRatio: 0.42, message: "Una notificacion tapa medio pensamiento.", tone: "warning" },
      { triggerAtRatio: 0.2, message: "La barra se achica. Tu mano no.", tone: "error" },
    ],
  },
  {
    id: "prioridad",
    title: "Estado del ticket",
    ticket: "TICKET 302",
    url: "intranet.local/php/ticket-302",
    browserHeading: "ticketUrgente($prioridad)",
    browserCopy: "Soporte pide marcar como urgente cualquier prioridad mayor a tres.",
    expected: `<?php
function ticketUrgente($prioridad) {
    return $prioridad > 3;
}
?>`,
    timeLimitMs: 42000,
    startMessage: "Soporte pide distinguir urgencias. Todas parecen urgentes desde aca.",
    successMessage: "El clasificador responde. Por ahora, nada explota.",
    timeoutMessage: "Los tickets se mezclan. Normal y urgente pesan igual.",
    pressureEvents: [
      { triggerAtRatio: 0.72, message: "Chat de soporte: hay tres personas escribiendo.", tone: "neutral" },
      { triggerAtRatio: 0.46, message: "El jefe pasa detras de tu silla sin hablar.", tone: "warning" },
      { triggerAtRatio: 0.22, message: "La condicion queda abierta como una puerta mal cerrada.", tone: "error" },
    ],
  },
  {
    id: "cierre",
    title: "Cierre simple",
    ticket: "TICKET 411",
    url: "intranet.local/php/ticket-411",
    browserHeading: "cerrarTicket($id)",
    browserCopy: "El ultimo pedido solo necesita dejar una marca simple antes del almuerzo.",
    expected: `<?php
function cerrarTicket($id) {
    return "cerrado-" . $id;
}
?>`,
    timeLimitMs: 44000,
    startMessage: "El ultimo pedido llega cuando ya pensabas en salir al corte.",
    successMessage: "El cierre entra. El monitor se queda con el brillo pegado a la cara.",
    timeoutMessage: "El cierre queda a medias. El turno no termina, se acumula.",
    pressureEvents: [
      { triggerAtRatio: 0.75, message: "La oficina ya aprendio a sonar como estatica.", tone: "neutral" },
      { triggerAtRatio: 0.5, message: "El cafe frio espera al lado del teclado.", tone: "warning" },
      { triggerAtRatio: 0.24, message: "Los numeros empiezan a parecer iguales.", tone: "error" },
    ],
  },
];

const OUTCOME_CHOICE_IDS: Record<WorkMinigameOutcome, string> = {
  clean: "finish_work_shift_clean",
  strained: "finish_work_shift_strained",
  failed: "finish_work_shift_failed",
};

const MINIMUM_COMPLETED_TASKS_FOR_LUNCH = 2;
const CORRECT_CHARACTER_TIME_BONUS_MS = 180;
const INPUT_MISTAKE_TIME_PENALTY_MS = 900;
const MAX_BONUS_TIME_MS = 16000;
const TIME_ADJUSTMENT_FLASH_MS = 240;

export class WorkMinigameScreen {
  private elements: WorkMinigameElements | null = null;
  private taskIndex = 0;
  private completedTasks = 0;
  private failedTasks = 0;
  private totalStrain = 0;
  private currentTaskMistakes = 0;
  private correctKeystrokeRun = 0;
  private furthestCorrectCharacterCount = 0;
  private currentPressureEventIndex = 0;
  private lastTypedLength = 0;
  private lastWasPrefix = true;
  private lastMismatchIndex = -1;
  private logEntryId = 0;
  private taskResults: WorkTaskResult[] = [];
  private readonly feedMessages: string[] = [];
  private taskDeadlineAt = 0;
  private taskMaximumDeadlineAt = 0;
  private active = false;
  private locked = false;
  private frameRequestId: number | null = null;
  private advanceTimeoutId: number | null = null;
  private timeAdjustmentTimeoutId: number | null = null;
  private onComplete: ((choiceId: string) => void) | null = null;
  private completionRequested = false;

  constructor(private readonly parent: HTMLDivElement) {}

  mount(onComplete: (choiceId: string) => void): void {
    this.unmount();
    this.parent.className = "visual-placeholder visual-placeholder--work-minigame";
    this.parent.hidden = false;
    this.parent.replaceChildren();

    this.onComplete = onComplete;
    this.active = true;
    this.locked = false;
    this.completionRequested = false;
    this.taskIndex = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.totalStrain = 0;
    this.currentTaskMistakes = 0;
    this.correctKeystrokeRun = 0;
    this.furthestCorrectCharacterCount = 0;
    this.currentPressureEventIndex = 0;
    this.lastTypedLength = 0;
    this.lastWasPrefix = true;
    this.lastMismatchIndex = -1;
    this.logEntryId = 0;
    this.taskResults = WORK_TASKS.map(() => "pending");
    this.feedMessages.length = 0;
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

    if (this.timeAdjustmentTimeoutId !== null) {
      window.clearTimeout(this.timeAdjustmentTimeoutId);
      this.timeAdjustmentTimeoutId = null;
    }

    this.active = false;
    this.locked = false;
    this.completionRequested = false;
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

    const strainLabel = document.createElement("span");
    strainLabel.className = "work-minigame__strain-label";

    const strainTrack = document.createElement("div");
    strainTrack.className = "work-minigame__bar work-minigame__bar--strain";

    const strainFill = document.createElement("div");
    strainFill.className = "work-minigame__bar-fill";
    strainTrack.append(strainFill);

    pressurePanel.append(timerLabel, timerTrack, progressLabel, progressTrack, strainLabel, strainTrack);
    const headerStatus = document.createElement("div");
    headerStatus.className = "work-minigame__header-status";

    const queuePanel = document.createElement("section");
    queuePanel.className = "work-task-queue-strip";
    queuePanel.setAttribute("aria-label", "Cola de tickets");

    const queueList = document.createElement("div");
    queueList.className = "work-task-queue";
    queuePanel.append(queueList);

    headerStatus.append(taskLabel, queuePanel);
    header.append(headerStatus, pressurePanel);

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
    editor.wrap = "soft";
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
      strainLabel,
      strainFill,
      queueList,
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
    this.currentTaskMistakes = 0;
    this.correctKeystrokeRun = 0;
    this.furthestCorrectCharacterCount = 0;
    this.currentPressureEventIndex = 0;
    this.lastTypedLength = 0;
    this.lastWasPrefix = true;
    this.lastMismatchIndex = -1;
    this.taskResults[this.taskIndex] = "active";
    elements.root.dataset.state = "typing";
    elements.root.dataset.rhythm = "searching";
    delete elements.root.dataset.timeAdjustment;
    elements.timerLabel.removeAttribute("data-delta");
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
    this.renderStrain();
    this.renderTaskQueue();
    this.addFeedMessage(task.startMessage, "neutral");
    this.renderCodeReference(task);
    this.updateCodeReferenceProgress("", true);
    this.startTaskTimer();
    requestAnimationFrame(() => elements.editor.focus({ preventScroll: true }));
  }

  private renderCodeReference(task: WorkTask): void {
    const elements = this.requireElements();
    const rows = task.expected.split("\n").map((line, index) => {
      const row = document.createElement("div");
      row.className = "work-browser__code-row";
      row.dataset.lineState = "pending";

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
    this.taskMaximumDeadlineAt =
      this.taskDeadlineAt + Math.min(MAX_BONUS_TIME_MS, task.expected.length * CORRECT_CHARACTER_TIME_BONUS_MS);
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
    this.triggerPressureEvents(ratio);
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
    const previousRun = this.correctKeystrokeRun;

    elements.progressLabel.textContent = `CODIGO ${typedText.length}/${task.expected.length}`;
    elements.progressFill.style.transform = `scaleX(${progress})`;
    elements.terminalWindow.dataset.input = isPrefix ? "valid" : "error";
    elements.terminalStatus.textContent = isPrefix
      ? this.getTerminalSyncLabel(progress)
      : `ERROR COL ${this.getFirstMismatchIndex(task.expected, typedText) + 1}`;
    this.updateCodeReferenceProgress(typedText, isPrefix);

    if (isPrefix) {
      this.lastMismatchIndex = -1;
      const addedCharacterCount = Math.max(0, typedText.length - this.lastTypedLength);
      const newlyConfirmedCharacterCount = Math.max(0, typedText.length - this.furthestCorrectCharacterCount);
      this.correctKeystrokeRun = addedCharacterCount > 0 ? this.correctKeystrokeRun + addedCharacterCount : 0;

      if (newlyConfirmedCharacterCount > 0) {
        this.furthestCorrectCharacterCount = typedText.length;
        this.adjustTaskTime(newlyConfirmedCharacterCount * CORRECT_CHARACTER_TIME_BONUS_MS);
      }

      if (!this.lastWasPrefix && typedText.length > 0) {
        this.addFeedMessage("La linea vuelve a encajar. El ruido baja apenas.", "success");
      }

      if (
        this.correctKeystrokeRun >= 28 &&
        Math.floor(previousRun / 28) < Math.floor(this.correctKeystrokeRun / 28)
      ) {
        this.addFeedMessage("Ritmo estable. El teclado deja de sentirse ajeno.", "success");
      }
    } else {
      this.correctKeystrokeRun = 0;
      const timeExpired = this.registerInputMistake(task.expected, typedText);

      if (timeExpired) {
        return;
      }
    }

    elements.root.dataset.rhythm = this.correctKeystrokeRun >= 28 ? "stable" : "searching";
    this.lastTypedLength = typedText.length;
    this.lastWasPrefix = isPrefix;

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
    const task = this.getCurrentTask();
    const remainingRatio = Math.max(0, Math.min(1, (this.taskDeadlineAt - performance.now()) / task.timeLimitMs));
    this.locked = true;
    this.stopTimer();
    elements.editor.disabled = true;

    if (success) {
      this.completedTasks += 1;
      this.taskResults[this.taskIndex] = "success";
      elements.root.dataset.state = "success";
      elements.terminalWindow.dataset.input = "valid";
      elements.terminalStatus.textContent = "COMPILADO";
      this.addFeedMessage(task.successMessage, "success");

      if (remainingRatio <= 0.18) {
        this.increaseStrain(1);
        this.addFeedMessage("Compila, pero el cierre llega demasiado cerca del borde.", "warning");
      }
    } else {
      this.failedTasks += 1;
      this.taskResults[this.taskIndex] = "failed";
      elements.root.dataset.state = "expired";
      elements.terminalWindow.dataset.input = "error";
      elements.terminalStatus.textContent = "TIEMPO AGOTADO";
      this.increaseStrain(2);
      this.addFeedMessage(task.timeoutMessage, "error");
    }

    this.renderTaskQueue();
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
    delete elements.root.dataset.timeAdjustment;
    elements.taskLabel.textContent = "CIERRE DE TURNO";
    elements.timerLabel.textContent = `OK ${this.completedTasks}/${WORK_TASKS.length}`;
    elements.timerLabel.removeAttribute("data-delta");
    elements.progressLabel.textContent = `ERRORES ${this.failedTasks}`;
    elements.timerFill.style.transform = "scaleX(0)";
    elements.progressFill.style.transform = `scaleX(${this.completedTasks / WORK_TASKS.length})`;
    this.renderStrain();
    this.renderTaskQueue();
    elements.terminalStatus.textContent = this.getOutcomeLabel(outcome);
    this.addFeedMessage(this.getOutcomeFeedMessage(outcome), outcome === "clean" ? "success" : outcome === "failed" ? "error" : "warning");

    this.renderOutcomePanel(outcome, choiceId);

    if (outcome === "clean") {
      return;
    }

    this.advanceTimeoutId = window.setTimeout(() => {
      this.advanceTimeoutId = null;
      this.completeMinigame(choiceId);
    }, 900);
  }

  private renderOutcomePanel(outcome: WorkMinigameOutcome, choiceId: string): void {
    const elements = this.requireElements();
    const title = document.createElement("strong");
    title.className = "work-minigame__outcome-title";
    title.textContent = this.getOutcomeLabel(outcome);

    const detail = document.createElement("span");
    detail.className = "work-minigame__outcome-detail";
    detail.textContent = `${this.completedTasks}/${WORK_TASKS.length} tickets, ${this.failedTasks} vencidos, ruido ${this.totalStrain}.`;

    const panel = document.createElement("div");
    panel.className = "work-minigame__outcome";
    panel.dataset.outcome = outcome;
    panel.append(title, detail);

    elements.browserAddress.textContent = outcome === "clean" ? "git.local/turno/commit-final" : "intranet.local/turno/resumen";
    elements.browserTitle.textContent = outcome === "clean" ? "Commit listo" : "Resumen del turno";
    elements.browserCopy.textContent = this.getOutcomeBrowserCopy(outcome);
    elements.editor.value = this.getOutcomeTerminalText(outcome);
    elements.editor.disabled = true;

    if (outcome === "clean") {
      const button = document.createElement("button");
      button.className = "work-minigame__commit-button";
      button.type = "button";
      button.textContent = "CERRAR COMMIT";
      button.addEventListener("click", () => this.completeMinigame(choiceId));

      panel.append(button);
      elements.browserCode.replaceChildren(panel);
      requestAnimationFrame(() => button.focus({ preventScroll: true }));
      return;
    }

    elements.browserCode.replaceChildren(panel);
  }

  private completeMinigame(choiceId: string): void {
    if (this.completionRequested) {
      return;
    }

    this.completionRequested = true;
    this.onComplete?.(choiceId);
  }

  private getOutcome(): WorkMinigameOutcome {
    if (this.completedTasks === WORK_TASKS.length) {
      return "clean";
    }

    if (this.completedTasks >= MINIMUM_COMPLETED_TASKS_FOR_LUNCH) {
      return "strained";
    }

    return "failed";
  }

  private getOutcomeLabel(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return "COMMIT LISTO";
      case "strained":
        return "CORTE HABILITADO";
      case "failed":
        return "HORAS EXTRA";
      default:
        return this.assertNever(outcome);
    }
  }

  private getOutcomeFeedMessage(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return "Los cuatro tickets cierran. Falta confirmar el commit final.";
      case "strained":
        return "Completaste lo minimo. Te dejan salir al corte de almuerzo.";
      case "failed":
        return "Te quedas corrigiendo errores. El corte de almuerzo se pierde.";
      default:
        return this.assertNever(outcome);
    }
  }

  private getOutcomeBrowserCopy(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return "La cola quedo vacia. El commit final espera una confirmacion antes del corte.";
      case "strained":
        return "La cola baja lo suficiente. El corte queda habilitado.";
      case "failed":
        return "La cola no cierra. Quedan correcciones fuera de hora.";
      default:
        return this.assertNever(outcome);
    }
  }

  private getOutcomeTerminalText(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return [
          "> tests internos: pasan",
          "> tickets: 4 cerrados",
          "> commit: pendiente de cierre",
        ].join("\n");
      case "strained":
        return [
          "> tickets minimos: cerrados",
          "> corte: habilitado",
        ].join("\n");
      case "failed":
        return [
          "> tickets pendientes",
          "> correcciones: fuera de hora",
        ].join("\n");
      default:
        return this.assertNever(outcome);
    }
  }

  private getTerminalSyncLabel(progress: number): string {
    if (progress >= 0.96) {
      return "CERRANDO";
    }

    if (this.correctKeystrokeRun >= 28) {
      return "RITMO ESTABLE";
    }

    return "SINCRONIZANDO";
  }

  private renderTaskQueue(): void {
    const elements = this.requireElements();
    const rows = WORK_TASKS.map((task, index) => {
      const result = this.taskResults[index] ?? "pending";
      const row = document.createElement("div");
      row.className = "work-task-queue__item";
      row.dataset.state = result;

      const marker = document.createElement("span");
      marker.className = "work-task-queue__marker";
      marker.textContent = this.getTaskMarker(result);

      const text = document.createElement("span");
      text.className = "work-task-queue__text";
      text.textContent = task.ticket.replace("TICKET ", "#");
      row.title = `${task.ticket}: ${task.title}`;

      row.append(marker, text);
      return row;
    });

    elements.queueList.replaceChildren(...rows);
  }

  private getTaskMarker(result: WorkTaskResult): string {
    switch (result) {
      case "success":
        return "OK";
      case "failed":
        return "!!";
      case "active":
        return ">>";
      case "pending":
        return "--";
      default:
        return this.assertNeverTaskResult(result);
    }
  }

  private addFeedMessage(message: string, tone: WorkLogTone): void {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    this.logEntryId += 1;
    const tonePrefix = tone === "neutral" ? "" : `${tone.toUpperCase()} `;
    const feedMessage = `${String(this.logEntryId).padStart(2, "0")} ${tonePrefix}${normalizedMessage}`;
    this.feedMessages.push(feedMessage);

    while (this.feedMessages.length > 7) {
      this.feedMessages.shift();
    }
  }

  private triggerPressureEvents(timeRatio: number): void {
    if (this.locked || !this.active || this.taskIndex >= WORK_TASKS.length) {
      return;
    }

    const task = this.getCurrentTask();

    while (
      this.currentPressureEventIndex < task.pressureEvents.length &&
      timeRatio <= task.pressureEvents[this.currentPressureEventIndex].triggerAtRatio
    ) {
      const pressureEvent = task.pressureEvents[this.currentPressureEventIndex];
      this.addFeedMessage(pressureEvent.message, pressureEvent.tone);
      this.currentPressureEventIndex += 1;
    }
  }

  private adjustTaskTime(amountMs: number): void {
    if (this.locked || !this.active) {
      return;
    }

    const elements = this.requireElements();
    const now = performance.now();
    const nextDeadline =
      amountMs > 0
        ? Math.min(this.taskMaximumDeadlineAt, this.taskDeadlineAt + amountMs)
        : Math.max(now, this.taskDeadlineAt + amountMs);

    this.taskDeadlineAt = nextDeadline;
    this.renderTimer(this.getCurrentTimeRemainingMs());
    this.flashTimeAdjustment(amountMs);
    elements.terminalStatus.textContent =
      amountMs > 0 ? this.getTerminalSyncLabel(this.getTaskProgressRatio()) : "TIEMPO RESTADO";
  }

  private flashTimeAdjustment(amountMs: number): void {
    const elements = this.requireElements();
    const direction = amountMs > 0 ? "gain" : "loss";
    const deltaLabel = `${amountMs > 0 ? "+" : "-"}${(Math.abs(amountMs) / 1000).toFixed(1)}s`;

    delete elements.root.dataset.timeAdjustment;
    elements.timerLabel.setAttribute("data-delta", deltaLabel);

    requestAnimationFrame(() => {
      if (!this.elements || this.locked) {
        return;
      }

      elements.root.dataset.timeAdjustment = direction;
    });

    if (this.timeAdjustmentTimeoutId !== null) {
      window.clearTimeout(this.timeAdjustmentTimeoutId);
    }

    this.timeAdjustmentTimeoutId = window.setTimeout(() => {
      this.timeAdjustmentTimeoutId = null;

      if (!this.elements) {
        return;
      }

      delete elements.root.dataset.timeAdjustment;
      elements.timerLabel.removeAttribute("data-delta");
    }, TIME_ADJUSTMENT_FLASH_MS);
  }

  private registerInputMistake(expectedText: string, typedText: string): boolean {
    const mismatchIndex = this.getFirstMismatchIndex(expectedText, typedText);

    if (mismatchIndex === this.lastMismatchIndex) {
      return false;
    }

    this.lastMismatchIndex = mismatchIndex;
    this.currentTaskMistakes += 1;
    this.increaseStrain(1);
    this.adjustTaskTime(-INPUT_MISTAKE_TIME_PENALTY_MS);

    if (this.currentTaskMistakes <= 3 || this.currentTaskMistakes % 3 === 0) {
      this.addFeedMessage(`Desfase en columna ${mismatchIndex + 1}. El monitor devuelve ruido.`, "error");
    }

    if (this.getCurrentTimeRemainingMs() <= 0) {
      this.finishTask(false);
      return true;
    }

    return false;
  }

  private increaseStrain(amount: number): void {
    this.totalStrain = Math.max(0, Math.min(9, this.totalStrain + amount));
    this.renderStrain();
  }

  private renderStrain(): void {
    const elements = this.requireElements();
    const strainRatio = this.totalStrain / 9;

    elements.strainLabel.textContent = `RUIDO ${this.totalStrain}/9`;
    elements.strainFill.style.transform = `scaleX(${strainRatio})`;
    elements.root.dataset.strain = this.totalStrain >= 7 ? "high" : this.totalStrain >= 4 ? "medium" : "low";
  }

  private updateCodeReferenceProgress(typedText: string, inputIsPrefix: boolean): void {
    const elements = this.requireElements();
    const task = this.getCurrentTask();
    const rows = Array.from(elements.browserCode.querySelectorAll<HTMLDivElement>(".work-browser__code-row"));
    const lines = task.expected.split("\n");
    const mismatchIndex = inputIsPrefix ? -1 : this.getFirstMismatchIndex(task.expected, typedText);
    let lineStartIndex = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const hasTrailingNewline = index < lines.length - 1;
      const lineEndIndex = lineStartIndex + lines[index].length + (hasTrailingNewline ? 1 : 0);
      const row = rows[index];

      if (!row) {
        throw new Error(`Missing code reference row at index ${index}.`);
      }

      const mismatchIsOnLine =
        mismatchIndex >= lineStartIndex &&
        (mismatchIndex < lineEndIndex || (index === lines.length - 1 && mismatchIndex >= task.expected.length));

      if (mismatchIsOnLine) {
        row.dataset.lineState = "error";
      } else if (typedText.length >= lineEndIndex) {
        row.dataset.lineState = "complete";
      } else if (typedText.length >= lineStartIndex) {
        row.dataset.lineState = "current";
      } else {
        row.dataset.lineState = "pending";
      }

      lineStartIndex = lineEndIndex;
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
      totalStrain: this.totalStrain,
      currentTaskMistakes: this.currentTaskMistakes,
      taskResults: [...this.taskResults],
      currentTaskTitle: task?.title ?? null,
      expectedText: task?.expected ?? null,
      typedText,
      timeRemainingMs,
      timeBonusPerCorrectCharacterMs: CORRECT_CHARACTER_TIME_BONUS_MS,
      timePenaltyPerMistakeMs: INPUT_MISTAKE_TIME_PENALTY_MS,
      inputMatchesExpectedPrefix: task ? task.expected.startsWith(typedText) : true,
      feedMessages: [...this.feedMessages],
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

  private getTaskProgressRatio(): number {
    const task = this.getCurrentTask();
    return Math.min(1, this.getTypedText().length / task.expected.length);
  }

  private getCurrentTimeRemainingMs(): number {
    return Math.max(0, this.taskDeadlineAt - performance.now());
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

  private assertNeverTaskResult(result: never): never {
    throw new Error(`Unsupported work task result: ${result}`);
  }
}
