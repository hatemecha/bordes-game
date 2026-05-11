export type FlagValue = boolean | number | string;
export type FlagSnapshot = Record<string, FlagValue>;

export type FlagCondition =
  | { flag: string; equals: FlagValue }
  | { flag: string; notEquals: FlagValue }
  | { flag: string; exists: true }
  | { flag: string; gte: number }
  | { flag: string; lte: number };

export type CinematicSequence = {
  kind: "sequence";
  baseKey: string;
  frameCount: number;
  fps?: number;
  loop?: boolean;
  holdOnLastFrame?: boolean;
};

export type CinematicStill = {
  kind: "still";
  key: string;
};

export type CinematicDefinition = CinematicSequence | CinematicStill;

export type ChoiceEffect =
  | { type: "setFlag"; flag: string; value: FlagValue }
  | { type: "incrementFlag"; flag: string; amount?: number }
  | { type: "adjustNumberFlag"; flag: string; amount: number; min?: number; max?: number }
  | { type: "toggleFlag"; flag: string };

export type Choice = {
  id: string;
  text: string;
  nextNodeId: string;
  conditions?: FlagCondition[];
  effects?: ChoiceEffect[];
  effectText?: string;
};

export type StoryDisplayMode = "title" | "chapter" | "story" | "ending";

export type StoryNode = {
  id: string;
  title: string;
  lines: string[];
  question?: string;
  visualPlaceholder?: string;
  /** Public URL (e.g. `/story/bedroom-dawn-6am.png`) shown in the visual area instead of placeholder text. */
  visualImage?: string;
  visualImageAlt?: string;
  displayMode?: StoryDisplayMode;
  showStats?: boolean;
  cinematic?: CinematicDefinition;
  choices: Choice[];
  onEnter?: ChoiceEffect[];
  onLeave?: ChoiceEffect[];
};

export type PresentedChoice = Choice & {
  isAvailable: boolean;
};

export type PresentedNode = Omit<StoryNode, "choices"> & {
  choices: PresentedChoice[];
  lastEffectText: string | null;
  flags: FlagSnapshot;
};

export type StorySnapshot = {
  currentNodeId: string;
  currentNodeTitle: string;
  displayMode: StoryDisplayMode;
  availableChoiceIds: string[];
  flags: FlagSnapshot;
  lastEffectText: string | null;
  ending: string;
};
