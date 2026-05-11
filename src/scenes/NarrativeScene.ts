import Phaser from "phaser";
import { FrameSequencePlayer } from "../cinematic/FrameSequencePlayer";
import { GAME_HEIGHT, GAME_WIDTH } from "../game/createGame";
import { FlagStore } from "../narrative/FlagStore";
import { StoryRunner } from "../narrative/StoryRunner";
import { chapterOneInitialFlags, chapterOneNodes } from "../narrative/script/chapter-one-monotony.nodes";
import type { PresentedNode, StorySnapshot } from "../narrative/types";

declare global {
  interface Window {
    chooseStoryChoice?: (choiceId: string) => void;
    getStorySnapshot?: () => StorySnapshot;
    getCinematicSnapshot?: () => ReturnType<FrameSequencePlayer["getState"]>;
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

export class NarrativeScene extends Phaser.Scene {
  private storyRunner!: StoryRunner;
  private frameSequencePlayer!: FrameSequencePlayer;
  private currentNode!: PresentedNode;
  private readonly manualStepMs = 1000 / 60;

  constructor() {
    super("NarrativeScene");
  }

  create(): void {
    this.storyRunner = new StoryRunner(
      chapterOneNodes,
      "title_screen",
      new FlagStore(chapterOneInitialFlags),
    );
    this.createCinematicLayer();
    this.bindWindowHooks();
    this.presentCurrentNode();
  }

  update(_time: number, delta: number): void {
    this.frameSequencePlayer.update(delta);
  }

  private createCinematicLayer(): void {
    const image = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "empty")
      .setOrigin(0.5)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.frameSequencePlayer = new FrameSequencePlayer(this, image);
  }

  private bindWindowHooks(): void {
    window.chooseStoryChoice = (choiceId: string) => {
      this.choose(choiceId);
    };
    window.getStorySnapshot = () => this.storyRunner.getSnapshot();
    window.getCinematicSnapshot = () => this.frameSequencePlayer.getState();
    window.render_game_to_text = () => this.renderGameToText();
    window.advanceTime = (ms: number) => this.advanceTime(ms);
  }

  private presentCurrentNode(): void {
    this.currentNode = this.storyRunner.presentNode();
    this.frameSequencePlayer.play(this.currentNode.cinematic);
    this.game.events.emit("story:presented", this.currentNode);
  }

  private choose(choiceId: string): void {
    try {
      this.currentNode = this.storyRunner.choose(choiceId);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
      this.currentNode = this.storyRunner.presentNode();
    }

    this.frameSequencePlayer.play(this.currentNode.cinematic);
    this.game.events.emit("story:presented", this.currentNode);
  }

  private advanceTime(ms: number): void {
    const steps = Math.max(1, Math.round(ms / this.manualStepMs));

    for (let index = 0; index < steps; index += 1) {
      this.frameSequencePlayer.update(this.manualStepMs);
    }

    this.game.renderer.snapshot(() => undefined);
  }

  private renderGameToText(): string {
    return JSON.stringify({
      coordinateSystem: "origin top-left, x right, y down, logical canvas 640x360",
      story: this.storyRunner.getSnapshot(),
      cinematic: this.frameSequencePlayer.getState(),
      visiblePlaceholder: this.currentNode.visualPlaceholder ?? null,
      visibleChoices: this.currentNode.choices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        isAvailable: choice.isAvailable,
      })),
    });
  }
}
