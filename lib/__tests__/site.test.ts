import { describe, expect, it } from "vitest";
import { BETA_DISCLAIMER, BETA_FEEDBACK_URL, REPOSITORY_URL, SITE_DESCRIPTION, SITE_NAME } from "../site";

describe("site beta metadata and feedback", () => {
  it("keeps core site strings present for metadata and disclaimers", () => {
    expect(SITE_NAME).toBe("Cooking Lab");
    expect(SITE_DESCRIPTION).toContain("食材");
    expect(BETA_DISCLAIMER).toContain("演示估算");
    expect(BETA_DISCLAIMER).toContain("医学");
  });

  it("uses the public GitHub repository as the beta feedback destination", () => {
    expect(REPOSITORY_URL).toBe("https://github.com/chenyuankun1708-oss/Cooking-Lab");
    expect(BETA_FEEDBACK_URL).toContain(REPOSITORY_URL);
    expect(BETA_FEEDBACK_URL).toContain("template=beta-feedback.md");
  });
});
