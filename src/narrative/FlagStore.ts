import type { FlagSnapshot, FlagValue } from "./types";

export class FlagStore {
  private readonly flags = new Map<string, FlagValue>();

  constructor(initialFlags: FlagSnapshot = {}) {
    this.fromJSON(initialFlags);
  }

  get(flag: string): FlagValue | undefined {
    return this.flags.get(flag);
  }

  has(flag: string): boolean {
    return this.flags.has(flag);
  }

  set(flag: string, value: FlagValue): void {
    this.validateFlagName(flag);
    this.flags.set(flag, value);
  }

  increment(flag: string, amount = 1): number {
    this.validateFlagName(flag);
    const currentValue = this.flags.get(flag);

    if (currentValue !== undefined && typeof currentValue !== "number") {
      throw new Error(`Cannot increment non-number flag "${flag}".`);
    }

    const nextValue = (currentValue ?? 0) + amount;
    this.flags.set(flag, nextValue);
    return nextValue;
  }

  adjustNumber(flag: string, amount: number, bounds: { min?: number; max?: number } = {}): number {
    this.validateFlagName(flag);
    this.validateNumber(amount, `Adjustment for flag "${flag}"`);
    this.validateBounds(bounds);

    const currentValue = this.flags.get(flag);

    if (currentValue !== undefined && typeof currentValue !== "number") {
      throw new Error(`Cannot adjust non-number flag "${flag}".`);
    }

    const adjustedValue = (currentValue ?? 0) + amount;
    const nextValue = this.clampNumber(adjustedValue, bounds);
    this.flags.set(flag, nextValue);
    return nextValue;
  }

  toggle(flag: string): boolean {
    this.validateFlagName(flag);
    const currentValue = this.flags.get(flag);

    if (currentValue !== undefined && typeof currentValue !== "boolean") {
      throw new Error(`Cannot toggle non-boolean flag "${flag}".`);
    }

    const nextValue = !(currentValue ?? false);
    this.flags.set(flag, nextValue);
    return nextValue;
  }

  toJSON(): FlagSnapshot {
    return Object.fromEntries(this.flags.entries());
  }

  fromJSON(snapshot: FlagSnapshot): void {
    for (const [flag, value] of Object.entries(snapshot)) {
      this.set(flag, value);
    }
  }

  private validateFlagName(flag: string): void {
    if (flag.trim().length === 0) {
      throw new Error("Flag names cannot be empty.");
    }
  }

  private validateBounds(bounds: { min?: number; max?: number }): void {
    if (bounds.min !== undefined) {
      this.validateNumber(bounds.min, "Minimum bound");
    }

    if (bounds.max !== undefined) {
      this.validateNumber(bounds.max, "Maximum bound");
    }

    if (bounds.min !== undefined && bounds.max !== undefined && bounds.min > bounds.max) {
      throw new Error("Minimum bound cannot be greater than maximum bound.");
    }
  }

  private validateNumber(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} must be a finite number.`);
    }
  }

  private clampNumber(value: number, bounds: { min?: number; max?: number }): number {
    const withMinimum = bounds.min === undefined ? value : Math.max(bounds.min, value);
    return bounds.max === undefined ? withMinimum : Math.min(bounds.max, withMinimum);
  }
}
