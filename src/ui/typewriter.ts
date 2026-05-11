import { createTimeline, type Timeline } from "animejs";

/** Velocidad de máquina de escribir (carácter ≈ 22 ms → ~45 caracteres por segundo). */
export const TYPEWRITER_MS_PER_CHAR = 22;

export function cancelTypewriterTimeline(timeline: Timeline | null | undefined): void {
  timeline?.revert();
}

type ChainPos = number | "<" | "<<";

function addTypewriterToTimeline(
  timeline: Timeline,
  element: HTMLElement,
  text: string,
  position: ChainPos,
): void {
  element.textContent = "";

  if (text.length === 0) {
    return;
  }

  const state = { n: 0 };

  timeline.add(
    state,
    {
      n: text.length,
      duration: text.length * TYPEWRITER_MS_PER_CHAR,
      ease: "linear",
      onUpdate: () => {
        element.textContent = text.slice(0, Math.round(state.n));
      },
      onComplete: () => {
        element.textContent = text;
      },
    },
    position,
  );
}

/**
 * Título y párrafos en cadena; luego varias cadenas en paralelo (p. ej. textos de opciones).
 */
export function playPanelTypewriter(options: {
  sequential: Array<{ element: HTMLElement; text: string }>;
  parallelAfter?: Array<{ element: HTMLElement; text: string }>;
  onComplete?: () => void;
}): Timeline {
  const { sequential, parallelAfter = [], onComplete } = options;

  for (const segment of sequential) {
    segment.element.textContent = "";
  }

  for (const segment of parallelAfter) {
    segment.element.textContent = "";
  }

  const timeline = createTimeline({
    autoplay: true,
    onComplete: () => {
      onComplete?.();
    },
  });

  const nonEmptySequential = sequential.filter((s) => s.text.length > 0);
  let isFirst = true;

  for (const segment of nonEmptySequential) {
    addTypewriterToTimeline(timeline, segment.element, segment.text, isFirst ? 0 : "<");
    isFirst = false;
  }

  const nonEmptyParallel = parallelAfter.filter((s) => s.text.length > 0);
  const sequentialCount = nonEmptySequential.length;

  for (let index = 0; index < nonEmptyParallel.length; index += 1) {
    const segment = nonEmptyParallel[index]!;
    let position: ChainPos;

    if (index === 0) {
      position = sequentialCount > 0 ? "<" : 0;
    } else {
      position = "<<";
    }

    addTypewriterToTimeline(timeline, segment.element, segment.text, position);
  }

  if (nonEmptySequential.length === 0 && nonEmptyParallel.length === 0) {
    queueMicrotask(() => {
      onComplete?.();
    });
  }

  return timeline;
}

export function playSingleTypewriter(
  element: HTMLElement,
  text: string,
  onComplete?: () => void,
): Timeline {
  return playPanelTypewriter({
    sequential: [{ element, text }],
    onComplete,
  });
}
