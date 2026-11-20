import { describe, expect, it } from "vitest";
import {
  countryDisplayName,
  parseProfile,
  serializeProfile,
} from "./profile";

describe("respondent profile cookie", () => {
  it("書いて読める", () => {
    expect(parseProfile(serializeProfile({ country: "US", ageRange: "30s" }))).toEqual({
      country: "US",
      ageRange: "30s",
    });
    expect(parseProfile(serializeProfile({ country: null, ageRange: null }))).toEqual({
      country: null,
      ageRange: null,
    });
    expect(parseProfile("other.60plus")).toEqual({
      country: "other",
      ageRange: "60plus",
    });
  });
  it("おかしな値は null", () => {
    expect(parseProfile(undefined)).toBeNull();
    expect(parseProfile("ZZ.30s")).toBeNull();
    expect(parseProfile("US.99s")).toBeNull();
    expect(parseProfile("US")).toBeNull();
    expect(parseProfile("US.30s.x")).toBeNull();
  });
});

describe("countryDisplayName", () => {
  it("言語に合わせて国名を出す", () => {
    expect(countryDisplayName("US", "en", "Other")).toBe("United States");
    expect(countryDisplayName("other", "ja", "その他")).toBe("その他");
    expect(countryDisplayName("HK", "ja", "その他")).toBe("香港");
    expect(countryDisplayName("HK", "zh-Hans", "其他")).toBe("香港");
  });
});
