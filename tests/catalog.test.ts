import { describe, it, expect } from "vitest";
import { MODEL_CATALOG, getModelsByTier, findModel } from "../src/catalog.js";

describe("catalog", () => {
  it("has at least 20 models", () => {
    expect(MODEL_CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it("every model has required fields", () => {
    for (const m of MODEL_CATALOG) {
      expect(m.provider).toBeTruthy();
      expect(m.model).toBeTruthy();
      expect(m.tier).toBeTruthy();
    }
  });

  it("getModelsByTier returns only that tier", () => {
    const free = getModelsByTier("free");
    expect(free.length).toBeGreaterThan(0);
    for (const m of free) {
      expect(m.tier).toBe("free");
    }
  });

  it("findModel returns exact match", () => {
    const m = findModel("anthropic", "claude-sonnet-4-20250514");
    expect(m).toBeDefined();
    expect(m!.tier).toBe("premium");
  });

  it("findModel returns undefined for unknown model", () => {
    expect(findModel("anthropic", "nonexistent")).toBeUndefined();
  });

  it("has all 5 tiers represented", () => {
    const tiers = new Set(MODEL_CATALOG.map((m) => m.tier));
    expect(tiers).toContain("premium");
    expect(tiers).toContain("budget");
    expect(tiers).toContain("speed");
    expect(tiers).toContain("free");
    expect(tiers).toContain("local");
  });
});
