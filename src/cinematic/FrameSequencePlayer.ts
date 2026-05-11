import Phaser from "phaser";
import type { CinematicDefinition, CinematicSequence } from "../narrative/types";

const DEFAULT_FPS = 12;

export type FrameSequenceState = {
  kind: "none" | CinematicDefinition["kind"];
  key: string | null;
  frameIndex: number;
  frameCount: number;
  fps: number;
  isComplete: boolean;
};

export class FrameSequencePlayer {
  private currentDefinition: CinematicDefinition | null = null;
  private frameIndex = 0;
  private elapsedMs = 0;
  private isComplete = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly image: Phaser.GameObjects.Image,
  ) {}

  play(definition: CinematicDefinition | undefined): void {
    if (!definition) {
      this.currentDefinition = null;
      this.frameIndex = 0;
      this.elapsedMs = 0;
      this.isComplete = false;
      this.image.setTexture("empty");
      return;
    }

    this.currentDefinition = definition;
    this.frameIndex = 0;
    this.elapsedMs = 0;
    this.isComplete = false;
    this.applyCurrentTexture();
  }

  update(deltaMs: number): void {
    if (!this.currentDefinition || this.currentDefinition.kind === "still" || this.isComplete) {
      return;
    }

    const frameDurationMs = 1000 / (this.currentDefinition.fps ?? DEFAULT_FPS);
    this.elapsedMs += deltaMs;

    while (this.elapsedMs >= frameDurationMs) {
      this.elapsedMs -= frameDurationMs;
      this.advanceSequence(this.currentDefinition);
    }
  }

  getState(): FrameSequenceState {
    if (!this.currentDefinition) {
      return {
        kind: "none",
        key: null,
        frameIndex: 0,
        frameCount: 0,
        fps: DEFAULT_FPS,
        isComplete: false,
      };
    }

    if (this.currentDefinition.kind === "still") {
      return {
        kind: "still",
        key: this.currentDefinition.key,
        frameIndex: 0,
        frameCount: 1,
        fps: DEFAULT_FPS,
        isComplete: true,
      };
    }

    return {
      kind: "sequence",
      key: this.currentDefinition.baseKey,
      frameIndex: this.frameIndex,
      frameCount: this.currentDefinition.frameCount,
      fps: this.currentDefinition.fps ?? DEFAULT_FPS,
      isComplete: this.isComplete,
    };
  }

  private advanceSequence(sequence: CinematicSequence): void {
    const nextFrameIndex = this.frameIndex + 1;

    if (nextFrameIndex < sequence.frameCount) {
      this.frameIndex = nextFrameIndex;
      this.applyCurrentTexture();
      return;
    }

    if (sequence.loop) {
      this.frameIndex = 0;
      this.applyCurrentTexture();
      return;
    }

    this.frameIndex = sequence.holdOnLastFrame === false ? 0 : sequence.frameCount - 1;
    this.isComplete = true;
    this.applyCurrentTexture();
  }

  private applyCurrentTexture(): void {
    if (!this.currentDefinition) {
      return;
    }

    const textureKey =
      this.currentDefinition.kind === "still"
        ? this.currentDefinition.key
        : this.getSequenceFrameKey(this.currentDefinition.baseKey, this.frameIndex);

    if (!this.scene.textures.exists(textureKey)) {
      throw new Error(`Missing cinematic texture "${textureKey}".`);
    }

    this.image.setTexture(textureKey);
  }

  private getSequenceFrameKey(baseKey: string, frameIndex: number): string {
    return `${baseKey}_${String(frameIndex).padStart(3, "0")}`;
  }
}
