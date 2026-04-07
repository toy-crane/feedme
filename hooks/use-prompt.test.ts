import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePrompt } from "@/hooks/use-prompt";

describe("usePrompt", () => {
  it("초기 상태가 올바르다", () => {
    const { result } = renderHook(() => usePrompt());

    expect(result.current.prompt).toBe("");
    expect(result.current.promptOpen).toBe(false);
    expect(result.current.selectedPreset).toBe("");
  });

  it("프리셋 값 입력 시 selectedPreset이 설정된다", () => {
    const { result } = renderHook(() => usePrompt());

    act(() => result.current.setPrompt("요약해줘"));

    expect(result.current.prompt).toBe("요약해줘");
    expect(result.current.selectedPreset).toBe("요약해줘");
  });

  it("프리셋이 아닌 값 입력 시 selectedPreset이 빈 문자열이다", () => {
    const { result } = renderHook(() => usePrompt());

    act(() => result.current.setPrompt("직접 입력한 텍스트"));

    expect(result.current.prompt).toBe("직접 입력한 텍스트");
    expect(result.current.selectedPreset).toBe("");
  });

  it("promptOpen을 토글할 수 있다", () => {
    const { result } = renderHook(() => usePrompt());

    act(() => result.current.setPromptOpen(true));
    expect(result.current.promptOpen).toBe(true);

    act(() => result.current.setPromptOpen(false));
    expect(result.current.promptOpen).toBe(false);
  });

  it("reset 호출 시 모든 상태가 초기화된다", () => {
    const { result } = renderHook(() => usePrompt());

    act(() => {
      result.current.setPrompt("요약해줘");
      result.current.setPromptOpen(true);
    });

    expect(result.current.prompt).toBe("요약해줘");
    expect(result.current.promptOpen).toBe(true);

    act(() => result.current.reset());

    expect(result.current.prompt).toBe("");
    expect(result.current.promptOpen).toBe(false);
    expect(result.current.selectedPreset).toBe("");
  });
});
