import type { PresentedNode } from "../narrative/types";

export type GameEventMap = {
  "story:presented": PresentedNode;
};

type GameEventName = keyof GameEventMap;

export class GameEvents {
  private readonly target = new EventTarget();

  on<Name extends GameEventName>(
    name: Name,
    handler: (payload: GameEventMap[Name]) => void,
  ): () => void {
    const listener: EventListener = (event) => {
      handler((event as CustomEvent<GameEventMap[Name]>).detail);
    };

    this.target.addEventListener(name, listener);
    return () => this.target.removeEventListener(name, listener);
  }

  emit<Name extends GameEventName>(name: Name, payload: GameEventMap[Name]): void {
    this.target.dispatchEvent(new CustomEvent(name, { detail: payload }));
  }
}
