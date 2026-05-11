import type { Timeline } from "animejs";
import type { PresentedNode, StoryDisplayMode } from "../narrative/types";
import { cancelTypewriterTimeline, playSingleTypewriter } from "./typewriter";

export class VisualPlaceholder {
  private chapterDramaGeneration = 0;
  private placeholderTypewriterTimeline: Timeline | null = null;

  constructor(private readonly parent: HTMLElement) {}

  render(presentedNode: PresentedNode): void {
    cancelTypewriterTimeline(this.placeholderTypewriterTimeline);
    this.placeholderTypewriterTimeline = null;
    this.chapterDramaGeneration += 1;
    this.parent.classList.remove("visual-placeholder--chapter-drama");

    const displayMode = presentedNode.displayMode ?? "story";

    if (presentedNode.visualImage) {
      this.renderImage(presentedNode.visualImage, presentedNode.visualImageAlt ?? "", displayMode);
      return;
    }

    const text = this.getPlaceholderText(presentedNode, displayMode);
    this.parent.replaceChildren();
    this.parent.className = `visual-placeholder visual-placeholder--${displayMode}`;
    this.parent.hidden = text.length === 0;

    if (displayMode === "chapter" && text.length > 0) {
      const line = document.createElement("span");
      line.className = "visual-placeholder__chapter-text";
      line.textContent = text;
      this.parent.append(line);
      return;
    }

    if (displayMode === "title") {
      this.parent.textContent = text;
      return;
    }

    const span = document.createElement("span");
    span.className = "visual-placeholder__typed-text";
    this.parent.append(span);

    if (text.length === 0) {
      return;
    }

    this.placeholderTypewriterTimeline = playSingleTypewriter(span, text);
  }

  playChapterDrama(): Promise<void> {
    const generation = this.chapterDramaGeneration;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (generation !== this.chapterDramaGeneration) {
          resolve();
          return;
        }

        const done = (): void => {
          if (generation !== this.chapterDramaGeneration) {
            resolve();
            return;
          }

          this.parent.removeEventListener("animationend", done);
          this.parent.classList.remove("visual-placeholder--chapter-drama");
          resolve();
        };

        this.parent.classList.add("visual-placeholder--chapter-drama");
        this.parent.addEventListener("animationend", done, { once: true });
      });
    });
  }

  private renderImage(src: string, alt: string, displayMode: StoryDisplayMode): void {
    this.parent.replaceChildren();
    this.parent.className = `visual-placeholder visual-placeholder--${displayMode} visual-placeholder--has-image`;
    this.parent.hidden = false;

    const img = document.createElement("img");
    img.className = "visual-placeholder__image";
    img.src = src;
    img.alt = alt;
    img.decoding = "async";
    this.parent.append(img);
  }

  private getPlaceholderText(presentedNode: PresentedNode, displayMode: StoryDisplayMode): string {
    const placeholderText = presentedNode.visualPlaceholder ?? presentedNode.lines.join("\n");

    if (displayMode === "title" || displayMode === "chapter") {
      return placeholderText;
    }

    return placeholderText.trim();
  }
}
