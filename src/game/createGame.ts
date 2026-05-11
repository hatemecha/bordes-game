import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { NarrativeScene } from "../scenes/NarrativeScene";
import { PreloadScene } from "../scenes/PreloadScene";

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#000000",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
      preserveDrawingBuffer: true,
    },
    scene: [BootScene, PreloadScene, NarrativeScene],
  });
}
