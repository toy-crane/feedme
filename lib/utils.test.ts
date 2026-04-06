import { describe, it, expect } from "vitest";
import { buildCopyText } from "./utils";

describe("buildCopyText", () => {
  it("prompt가 있으면 prompt + 빈 줄 + markdown을 반환한다", () => {
    expect(buildCopyText("요약해줘", "# Hello")).toBe("요약해줘\n\n# Hello");
  });

  it("prompt가 빈 문자열이면 markdown만 반환한다", () => {
    expect(buildCopyText("", "# Hello")).toBe("# Hello");
  });

  it("prompt가 공백만 있으면 markdown만 반환한다", () => {
    expect(buildCopyText("  ", "# Hello")).toBe("# Hello");
  });

  it("prompt의 앞뒤 공백을 제거한 후 결합한다", () => {
    expect(buildCopyText("  요약해줘  ", "# Hello")).toBe("요약해줘\n\n# Hello");
  });
});
