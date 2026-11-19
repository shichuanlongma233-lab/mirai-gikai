import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/i18n/server", () => ({ getRespondentProfile: vi.fn() }));
vi.mock("@/features/chat/server/utils/supabase-server", () => ({
  getChatSupabaseUser: vi.fn(),
}));
vi.mock(
  "@/features/interview-session/server/services/generate-initial-question",
  () => ({ generateInitialQuestion: vi.fn().mockResolvedValue(null) })
);
const createRecord = vi.fn();
vi.mock("../repositories/interview-session-repository", () => ({
  createInterviewSessionRecord: (...args: unknown[]) => createRecord(...args),
  findActiveInterviewSession: vi.fn().mockResolvedValue(null),
  findInterviewMessagesBySessionId: vi.fn().mockResolvedValue([]),
}));

import { initializeInterviewChat } from "./initialize-interview-chat";

const getUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-1" } },
  error: null,
});

describe("initializeInterviewChat の国・年代の記録", () => {
  beforeEach(() => {
    createRecord.mockReset().mockResolvedValue({ id: "s1" });
  });

  it("答えた国・年代をセッションに記録する", async () => {
    await initializeInterviewChat("bill-1", "config-1", {
      getUser: getUser as never,
      getProfile: async () => ({ country: "US", ageRange: "30s" }),
    }).catch(() => {});
    expect(createRecord).toHaveBeenCalledWith({
      interviewConfigId: "config-1",
      userId: "user-1",
      respondentCountry: "US",
      respondentAgeRange: "30s",
    });
  });

  it("読めなければ null で記録する", async () => {
    await initializeInterviewChat("bill-1", "config-1", {
      getUser: getUser as never,
      getProfile: async () => {
        throw new Error("no request");
      },
    }).catch(() => {});
    expect(createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        respondentCountry: null,
        respondentAgeRange: null,
      })
    );
  });
});
