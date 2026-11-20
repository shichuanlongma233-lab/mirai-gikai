// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ProfileChooser } from "./profile-chooser";

describe("ProfileChooser", () => {
  it("国と年代を選ぶと Cookie に保存して画面を出し直す", () => {
    render(<ProfileChooser locale="en" />);
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "US" },
    });
    fireEvent.click(screen.getByRole("button", { name: "30s" }));
    expect(next).toBeEnabled();
    fireEvent.click(next);

    expect(document.cookie).toContain("mirai_profile=US.30s");
    expect(refresh).toHaveBeenCalled();
  });

  it("「答えない」も選べる", () => {
    render(<ProfileChooser locale="ja" />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "none" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "答えない" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(document.cookie).toContain("mirai_profile=-.-");
  });

  it("国名は回答者の言語で出す", () => {
    render(<ProfileChooser locale="ko" />);
    expect(screen.getByRole("option", { name: "미국" })).toBeInTheDocument();
  });
});
