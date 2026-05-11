import type { ChoiceEffect, FlagSnapshot, StoryNode } from "../types";

const INITIAL_AXIS_VALUE = 5;

const STORY_VARIABLE_FLAGS = {
  fatigueEnergy: "cansancio_energia",
  anxietyCalm: "ansiedad_tranquilidad",
} as const;

export const chapterOneInitialFlags: FlagSnapshot = {
  [STORY_VARIABLE_FLAGS.fatigueEnergy]: INITIAL_AXIS_VALUE,
  [STORY_VARIABLE_FLAGS.anxietyCalm]: INITIAL_AXIS_VALUE,
};

const resetInitialAxes = (): ChoiceEffect[] => [
  {
    type: "setFlag",
    flag: STORY_VARIABLE_FLAGS.fatigueEnergy,
    value: INITIAL_AXIS_VALUE,
  },
  {
    type: "setFlag",
    flag: STORY_VARIABLE_FLAGS.anxietyCalm,
    value: INITIAL_AXIS_VALUE,
  },
];

const adjustAxis = (
  flag: (typeof STORY_VARIABLE_FLAGS)[keyof typeof STORY_VARIABLE_FLAGS],
  amount: number,
): ChoiceEffect => ({
  type: "incrementFlag",
  flag,
  amount,
});

const homePlaceholder = (text: string): string => `[PLACEHOLDER - CASA]\n${text}`;
const workPlaceholder = (text: string): string => `[PLACEHOLDER - TRABAJO]\n${text}`;

export const chapterOneNodes: StoryNode[] = [
  {
    id: "title_screen",
    title: "BORDES",
    lines: [],
    visualPlaceholder: "BORDES",
    displayMode: "title",
    showStats: false,
    onEnter: resetInitialAxes(),
    choices: [
      {
        id: "start_game",
        text: "Iniciar juego",
        nextNodeId: "chapter_monotony_intro",
      },
    ],
  },
  {
    id: "chapter_monotony_intro",
    title: "I. MONOTONIA.",
    lines: [],
    visualPlaceholder: "I. MONOTONIA.",
    displayMode: "chapter",
    showStats: false,
    choices: [
      {
        id: "continue_to_alarm_0600",
        text: "Continuar",
        nextNodeId: "alarm_0600",
      },
    ],
  },
  {
    id: "alarm_0600",
    title: "6:00 AM - Suena la alarma",
    lines: ["Son las 6:00 AM. La alarma empieza a sonar."],
    question: "¿Despertar?",
    visualImage: "/story/bedroom-dawn-6am.png",
    visualImageAlt:
      "Dormitorio al amanecer: una mano sostiene un teléfono con la alarma a las 6:00 AM en una habitación oscura.",
    choices: [
      {
        id: "wake_at_0600",
        text: "Despertarme",
        effects: [adjustAxis(STORY_VARIABLE_FLAGS.anxietyCalm, 1)],
        effectText: "Te sentís un poco más tranquilo.",
        nextNodeId: "breakfast_early",
      },
      {
        id: "sleep_until_0700",
        text: "Quedarme dormido",
        effects: [
          adjustAxis(STORY_VARIABLE_FLAGS.anxietyCalm, -1),
          adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, 1),
        ],
        effectText: "Dormís un poco más, pero te despertás con más ansiedad.",
        nextNodeId: "alarm_0700",
      },
    ],
  },
  {
    id: "breakfast_early",
    title: "Desayuno temprano",
    lines: ["Tenés tiempo antes de salir. La casa todavía está en silencio."],
    question: "¿Desayunar?",
    visualPlaceholder: homePlaceholder(
      "Cocina quieta. Hay tiempo para preparar algo simple antes de salir hacia el trabajo.",
    ),
    choices: [
      {
        id: "eat_early_breakfast",
        text: "Desayunar",
        effects: [adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, 1)],
        effectText: "Te sentís con un poco más de energía.",
        nextNodeId: "arrive_work_early",
      },
      {
        id: "skip_early_breakfast",
        text: "No desayunar",
        effects: [adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, -1)],
        effectText: "Salís sin desayunar. Te sentís con menos energía.",
        nextNodeId: "arrive_work_early",
      },
    ],
  },
  {
    id: "alarm_0700",
    title: "7:00 AM - Segunda alarma",
    lines: ["Son las 7:00 AM. La alarma vuelve a sonar."],
    question: "¿Despertar?",
    visualPlaceholder: homePlaceholder(
      "La misma habitación, ahora con más luz. La alarma vuelve a insistir y el margen de tiempo se achica.",
    ),
    choices: [
      {
        id: "wake_at_0700",
        text: "Despertarme",
        nextNodeId: "breakfast_rushed",
      },
      {
        id: "sleep_until_0800",
        text: "Quedarme dormido",
        effects: [
          adjustAxis(STORY_VARIABLE_FLAGS.anxietyCalm, -1),
          adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, 1),
        ],
        effectText: "Dormís un poco más, pero la ansiedad empieza a pesar.",
        nextNodeId: "alarm_0800",
      },
    ],
  },
  {
    id: "breakfast_rushed",
    title: "Desayuno rápido",
    lines: ["Todavía podés comer algo antes de salir, pero ya no sobra tiempo."],
    question: "¿Desayunar?",
    visualPlaceholder: homePlaceholder(
      "Cocina apurada. Algo queda sobre la mesa, pero cada minuto empieza a importar.",
    ),
    choices: [
      {
        id: "eat_rushed_breakfast",
        text: "Desayunar",
        effects: [adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, 1)],
        effectText: "Comés algo rápido. Te sentís con un poco más de energía.",
        nextNodeId: "arrive_work_on_time",
      },
      {
        id: "skip_rushed_breakfast",
        text: "No desayunar",
        effects: [adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, -1)],
        effectText: "Salís sin desayunar. Te sentís con menos energía.",
        nextNodeId: "arrive_work_on_time",
      },
    ],
  },
  {
    id: "alarm_0800",
    title: "8:00 AM - Última oportunidad",
    lines: ["Son las 8:00 AM. Si no te levantás ahora, ya no vas a llegar al trabajo."],
    question: "¿Despertar?",
    visualPlaceholder: homePlaceholder(
      "Dormitorio demasiado iluminado. La alarma ya no suena como rutina: suena como una advertencia.",
    ),
    choices: [
      {
        id: "wake_at_0800",
        text: "Despertarme",
        effects: [
          adjustAxis(STORY_VARIABLE_FLAGS.fatigueEnergy, -1),
          adjustAxis(STORY_VARIABLE_FLAGS.anxietyCalm, -1),
        ],
        effectText:
          "Te levantás tarde, sin tiempo para desayunar. Te sentís más ansioso y con menos energía.",
        nextNodeId: "arrive_work_late",
      },
      {
        id: "do_not_wake_at_0800",
        text: "Quedarme dormido",
        nextNodeId: "ending_unemployed",
      },
    ],
  },
  {
    id: "arrive_work_early",
    title: "Llegar temprano al trabajo",
    lines: ["Llegás al trabajo con tiempo. Saludás a tus compañeros y empezás el día sin apuro."],
    visualPlaceholder: workPlaceholder(
      "Entrada del trabajo. El protagonista llega antes de que el día empiece a sentirse pesado.",
    ),
    choices: [
      {
        id: "continue_from_early_arrival",
        text: "Continuar",
        nextNodeId: "work_minigame_intro",
      },
    ],
  },
  {
    id: "arrive_work_on_time",
    title: "Llegar justo al trabajo",
    lines: [
      "Llegás justo a tiempo. No sobra nada, pero alcanzás a empezar el día sin llamar demasiado la atención.",
    ],
    visualPlaceholder: workPlaceholder(
      "Entrada del trabajo. El protagonista cruza la puerta casi al mismo tiempo que empieza la jornada.",
    ),
    choices: [
      {
        id: "continue_from_on_time_arrival",
        text: "Continuar",
        nextNodeId: "work_minigame_intro",
      },
    ],
  },
  {
    id: "arrive_work_late",
    title: "Llegar tarde al trabajo",
    lines: ["Llegás tarde. No saludás a nadie. Apenas entrás, te cruzás con tu jefe."],
    visualPlaceholder: workPlaceholder(
      "Pasillo de entrada. El jefe aparece antes de que el protagonista pueda acomodarse.",
    ),
    choices: [
      {
        id: "face_boss",
        text: "Continuar",
        nextNodeId: "boss_late_question",
      },
    ],
  },
  {
    id: "boss_late_question",
    title: "El jefe",
    lines: ["Tu jefe te mira apenas entrás. Quiere saber por qué llegaste tarde."],
    question: "¿Qué respondés?",
    visualPlaceholder: workPlaceholder(
      "Encuadre pendiente: el jefe frente al protagonista, bloqueando el paso en la entrada.",
    ),
    choices: [
      {
        id: "lie_to_boss",
        text: "Mentir",
        nextNodeId: "work_minigame_intro",
      },
      {
        id: "tell_boss_truth",
        text: "Decir la verdad",
        nextNodeId: "work_minigame_intro",
      },
    ],
  },
  {
    id: "work_minigame_intro",
    title: "Trabajo",
    lines: ["Placeholder de la próxima escena laboral. El minijuego de trabajo todavía está pendiente."],
    visualPlaceholder: workPlaceholder(
      "Lugar de trabajo pendiente. Acá empezará el próximo sistema jugable cuando esté definido.",
    ),
    choices: [],
  },
  {
    id: "ending_unemployed",
    title: "Final: Desempleado",
    lines: ["No te levantaste. Faltaste al trabajo. Perdiste tu empleo."],
    visualPlaceholder: "[PLACEHOLDER - FINAL]\nLa habitación queda quieta. El día sigue sin el protagonista.",
    displayMode: "ending",
    choices: [
      {
        id: "restart_after_unemployed_ending",
        text: "Volver a empezar",
        nextNodeId: "title_screen",
      },
    ],
  },
];
