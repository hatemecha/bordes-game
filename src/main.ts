import "./styles/global.css";
import { createGame } from "./game/createGame";
import { createRetroShell } from "./ui/createRetroShell";
import { NarrativePanel } from "./ui/narrative-panel";
import { VisualPlaceholder } from "./ui/visual-placeholder";
import { WorkMinigameScreen } from "./ui/work-minigame";
import type { PresentedNode } from "./narrative/types";

const rootElement = document.querySelector<HTMLElement>("#app");

if (!rootElement) {
  throw new Error('Missing root element "#app".');
}

const { cinematicElement, visualElement, narrativeElement } = createRetroShell(rootElement);
const visualPlaceholder = new VisualPlaceholder(visualElement);
const workMinigameScreen = new WorkMinigameScreen(visualElement);
const narrativePanel = new NarrativePanel(narrativeElement);
const game = createGame(cinematicElement);

game.events.on("story:presented", (presentedNode: PresentedNode) => {
  if (presentedNode.interactive?.kind === "work-minigame") {
    narrativeElement.hidden = true;
    workMinigameScreen.mount((choiceId) => {
      window.chooseStoryChoice?.(choiceId);
    });
    return;
  }

  workMinigameScreen.unmount();
  narrativeElement.hidden = false;
  visualPlaceholder.render(presentedNode);
  narrativePanel.render(presentedNode);

  if (presentedNode.displayMode === "chapter") {
    void visualPlaceholder.playChapterDrama().then(() => {
      const onlyAvailable = presentedNode.choices.filter((choice) => choice.isAvailable);
      if (onlyAvailable.length === 1) {
        window.chooseStoryChoice?.(onlyAvailable[0].id);
      }
    });
  }
});

narrativePanel.onChoice((choiceId) => {
  window.chooseStoryChoice?.(choiceId);
});
