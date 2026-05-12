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
  feedList: HTMLDivElement;
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
    startMessage: "Ventas empuja el siguiente pedido. Nadie pregunta si estas listo.",
    successMessage: "El calculo pasa. La cola baja por un segundo.",
    timeoutMessage: "Ventas reenvia el mismo pedido con asunto en mayusculas.",
    pressureEvents: [
      { triggerAtRatio: 0.7, message: "Correo interno: RE: RE: precio mal cargado.", tone: "neutral" },
      { triggerAtRatio: 0.42, message: "Una notificacion tapa medio pensamiento.", tone: "warning" },
      { triggerAtRatio: 0.2, message: "La barra se achica. Tu mano no.", tone: "error" },
    ],
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
    startMessage: "Recursos humanos manda una lista larga. Alguien la llama simple.",
    successMessage: "El total cierra. El monitor se queda con el brillo pegado a la cara.",
    timeoutMessage: "La lista queda a medio sumar. El turno no termina, se acumula.",
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

export class WorkMinigameScreen {
  private elements: WorkMinigameElements | null = null;
  private taskIndex = 0;
  private completedTasks = 0;
  private failedTasks = 0;
  private totalStrain = 0;
  private currentTaskMistakes = 0;
  private correctKeystrokeRun = 0;
  private currentPressureEventIndex = 0;
  private lastTypedLength = 0;
  private lastWasPrefix = true;
  private lastMismatchIndex = -1;
  private logEntryId = 0;
  private taskResults: WorkTaskResult[] = [];
  private readonly feedMessages: string[] = [];
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
    this.totalStrain = 0;
    this.currentTaskMistakes = 0;
    this.correctKeystrokeRun = 0;
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

    const strainLabel = document.createElement("span");
    strainLabel.className = "work-minigame__strain-label";

    const strainTrack = document.createElement("div");
    strainTrack.className = "work-minigame__bar work-minigame__bar--strain";

    const strainFill = document.createElement("div");
    strainFill.className = "work-minigame__bar-fill";
    strainTrack.append(strainFill);

    pressurePanel.append(timerLabel, timerTrack, progressLabel, progressTrack, strainLabel, strainTrack);
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

    const sidecar = document.createElement("aside");
    sidecar.className = "work-sidecar";

    const queuePanel = document.createElement("section");
    queuePanel.className = "work-sidecar__panel work-sidecar__panel--queue";

    const queueTitle = document.createElement("div");
    queueTitle.className = "work-sidecar__title";
    queueTitle.textContent = "cola";

    const queueList = document.createElement("div");
    queueList.className = "work-task-queue";
    queueList.setAttribute("aria-label", "Cola de tickets");
    queuePanel.append(queueTitle, queueList);

    const feedPanel = document.createElement("section");
    feedPanel.className = "work-sidecar__panel work-sidecar__panel--feed";

    const feedTitle = document.createElement("div");
    feedTitle.className = "work-sidecar__title";
    feedTitle.textContent = "registro";

    const feedList = document.createElement("div");
    feedList.className = "work-feed";
    feedList.setAttribute("aria-live", "polite");
    feedPanel.append(feedTitle, feedList);

    sidecar.append(queuePanel, feedPanel);
    desktop.append(terminalWindow, browserWindow, sidecar);
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
      feedList,
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
    this.currentPressureEventIndex = 0;
    this.lastTypedLength = 0;
    this.lastWasPrefix = true;
    this.lastMismatchIndex = -1;
    this.taskResults[this.taskIndex] = "active";
    elements.root.dataset.state = "typing";
    elements.root.dataset.rhythm = "searching";
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
      this.correctKeystrokeRun = addedCharacterCount > 0 ? this.correctKeystrokeRun + addedCharacterCount : 0;

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
      this.registerInputMistake(task.expected, typedText);
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
    elements.taskLabel.textContent = "TURNO CERRADO";
    elements.timerLabel.textContent = `OK ${this.completedTasks}/${WORK_TASKS.length}`;
    elements.progressLabel.textContent = `ERRORES ${this.failedTasks}`;
    elements.timerFill.style.transform = "scaleX(0)";
    elements.progressFill.style.transform = `scaleX(${this.completedTasks / WORK_TASKS.length})`;
    this.renderStrain();
    this.renderTaskQueue();
    elements.terminalStatus.textContent = this.getOutcomeLabel(outcome);
    this.addFeedMessage(this.getOutcomeFeedMessage(outcome), outcome === "clean" ? "success" : outcome === "failed" ? "error" : "warning");

    const result = document.createElement("div");
    result.className = "work-minigame__result";
    result.dataset.outcome = outcome;

    const title = document.createElement("strong");
    title.textContent = this.getOutcomeLabel(outcome);

    const details = document.createElement("span");
    details.textContent = `${this.completedTasks} tareas compiladas, ${this.failedTasks} vencidas, ruido ${this.totalStrain}.`;
    result.append(title, details);
    elements.root.append(result);

    this.advanceTimeoutId = window.setTimeout(() => {
      this.advanceTimeoutId = null;
      this.onComplete?.(choiceId);
    }, 1200);
  }

  private getOutcome(): WorkMinigameOutcome {
    if (this.completedTasks === WORK_TASKS.length && this.failedTasks === 0 && this.totalStrain <= 3) {
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

  private getOutcomeFeedMessage(outcome: WorkMinigameOutcome): string {
    switch (outcome) {
      case "clean":
        return "La cola queda vacia. Por unos segundos, la oficina no pide nada.";
      case "strained":
        return "La jornada cierra con ruido. El trabajo sale, pero se queda encima.";
      case "failed":
        return "La cola te pasa por arriba. El cierre ocurre sin terminar de cerrar.";
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
      text.textContent = `${task.ticket} ${task.title}`;

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
    const elements = this.requireElements();
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    this.logEntryId += 1;
    const feedMessage = `${String(this.logEntryId).padStart(2, "0")} ${normalizedMessage}`;
    this.feedMessages.push(feedMessage);

    while (this.feedMessages.length > 7) {
      this.feedMessages.shift();
    }

    const entry = document.createElement("div");
    entry.className = "work-feed__entry";
    entry.dataset.tone = tone;

    const stamp = document.createElement("span");
    stamp.className = "work-feed__stamp";
    stamp.textContent = String(this.logEntryId).padStart(2, "0");

    const body = document.createElement("span");
    body.className = "work-feed__body";
    body.textContent = normalizedMessage;

    entry.append(stamp, body);
    elements.feedList.append(entry);

    while (elements.feedList.childElementCount > 7) {
      elements.feedList.firstElementChild?.remove();
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

  private registerInputMistake(expectedText: string, typedText: string): void {
    const mismatchIndex = this.getFirstMismatchIndex(expectedText, typedText);

    if (mismatchIndex === this.lastMismatchIndex) {
      return;
    }

    this.lastMismatchIndex = mismatchIndex;
    this.currentTaskMistakes += 1;
    this.increaseStrain(1);

    if (this.currentTaskMistakes <= 3 || this.currentTaskMistakes % 3 === 0) {
      this.addFeedMessage(`Desfase en columna ${mismatchIndex + 1}. El monitor devuelve ruido.`, "error");
    }
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
