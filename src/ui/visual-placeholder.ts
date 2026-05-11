import type { PresentedNode, StoryDisplayMode } from "../narrative/types";

export class VisualPlaceholder {
  constructor(private readonly parent: HTMLElement) {}

  render(presentedNode: PresentedNode): void {
    const displayMode = presentedNode.displayMode ?? "story";
    const text = this.getPlaceholderText(presentedNode, displayMode);

    this.parent.className = `visual-placeholder visual-placeholder--${displayMode}`;
    this.parent.hidden = text.length === 0;
    this.parent.textContent = text;
  }

  private getPlaceholderText(presentedNode: PresentedNode, displayMode: StoryDisplayMode): string {
    const placeholderText = presentedNode.visualPlaceholder ?? presentedNode.lines.join("\n");

    if (displayMode === "title" || displayMode === "chapter") {
      return placeholderText;
    }

    return placeholderText.trim();
  }
}
