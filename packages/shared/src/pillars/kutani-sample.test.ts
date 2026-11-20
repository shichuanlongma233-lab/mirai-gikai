import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validatePillarSet } from "./validate";

describe("docs/pillars/kutani.json", () => {
  it("取り込める形になっている", () => {
    const json = JSON.parse(
      readFileSync(new URL("../../../../docs/pillars/kutani.json", import.meta.url), "utf8")
    );
    const r = validatePillarSet(json);
    expect(r.issues.filter((i) => i.level === "error")).toEqual([]);
    expect(r.ok).toBe(true);
  });
});
