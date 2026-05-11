import "./styles/global.css";
import { createGame } from "./game/createGame";
import { createRetroShell } from "./ui/createRetroShell";
import { NarrativePanel } from "./ui/narrative-panel";
import { VisualPlaceholder } from "./ui/visual-placeholder";
import type { PresentedNode } from "./narrative/types";

const rootElement = document.querySelector<HTMLElement>("#app");

if (!rootElement) {
  throw new Error('Missing root element "#app".');
}

const { cinematicElement, visualElement, narrativeElement } = createRetroShell(rootElement);
const visualPlaceholder = new VisualPlaceholder(visualElement);
const narrativePanel = new NarrativePanel(narrativeElement);
const game = createGame(cinematicElement);

game.events.on("story:presented", (presentedNode: PresentedNode) => {
  visualPlaceholder.render(presentedNode);
  narrativePanel.render(presentedNode);
});

narrativePanel.onChoice((choiceId) => {
  window.chooseStoryChoice?.(choiceId);
});
