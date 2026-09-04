import { describe, expect, it } from "vitest";
import { formatHumanCookingTime, getCookingTimeBand } from "../cooking-time";

describe("human cooking time", () => {
  it.each([
    [20, "quick", "轻松快手"],
    [21, "everyday", "日常料理"],
    [40, "everyday", "日常料理"],
    [41, "slow", "慢慢做"],
    [60, "slow", "慢慢做"],
    [61, "worth-waiting", "值得等待"],
  ] as const)("maps %i minutes to %s", (minutes, id, label) => {
    expect(getCookingTimeBand(minutes)).toEqual({ id, label });
  });

  it("keeps exact minutes next to the human-facing band", () => {
    expect(formatHumanCookingTime(20)).toBe("轻松快手 · 约 20 分钟");
  });
});
