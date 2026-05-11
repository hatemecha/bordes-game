export type RetroShellElements = {
  cinematicElement: HTMLDivElement;
  visualElement: HTMLDivElement;
  narrativeElement: HTMLDivElement;
};

export function createRetroShell(rootElement: HTMLElement): RetroShellElements {
  const shellElement = document.createElement("main");
  shellElement.className = "retro-shell";

  const cinematicElement = document.createElement("div");
  cinematicElement.id = "cinematic";
  cinematicElement.className = "cinematic-slot";

  const visualElement = document.createElement("div");
  visualElement.id = "visual-placeholder";
  visualElement.className = "visual-placeholder";
  visualElement.setAttribute("aria-live", "polite");

  const narrativeElement = document.createElement("div");
  narrativeElement.id = "narrative-ui";

  shellElement.append(cinematicElement, visualElement, narrativeElement);
  rootElement.replaceChildren(shellElement);

  return { cinematicElement, visualElement, narrativeElement };
}
