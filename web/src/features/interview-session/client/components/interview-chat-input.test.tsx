// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InterviewChatInput } from "./interview-chat-input";

function renderInput() {
  // 送信は form.requestSubmit() で行われるので、それが呼ばれたかを見る
  const onSubmit = vi
    .spyOn(HTMLFormElement.prototype, "requestSubmit")
    .mockImplementation(() => {});
  render(
    <InterviewChatInput
      input="こんにちは"
      onInputChange={vi.fn()}
      onSubmit={vi.fn()}
      placeholder="入力"
      isResponding={false}
    />
  );
  return { onSubmit, textarea: screen.getByPlaceholderText("入力") };
}

describe("InterviewChatInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Enter で送信する（スマホ・PC共通）", () => {
    const { onSubmit, textarea } = renderInput();
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Shift+Enter では送信しない（改行）", () => {
    const { onSubmit, textarea } = renderInput();
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("変換確定中の Enter では送信しない", () => {
    const { onSubmit, textarea } = renderInput();
    fireEvent.keyDown(textarea, { key: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
