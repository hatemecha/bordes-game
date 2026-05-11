import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../game/createGame";

const PALETTE = {
  black: 0x000000,
} as const;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {}

  create(): void {
    this.createEmptyTexture();
    this.scene.start("NarrativeScene");
  }

  private createEmptyTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(PALETTE.black, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.generateTexture("empty", GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();
  }
}
