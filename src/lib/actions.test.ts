// Test coverage for shared action helpers and utilities used by the RB-PMIS application.
// This file includes both UI helper tests for class name handling and
// scheduler action tests for deadline automation.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cn } from "./utils";
import { runDeadlineScheduler } from "./actions";

describe("actions utilities", () => {
  describe("cn utility", () => {
    it("should merge class names into a single string", () => {
      expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
    });

    it("should dedupe conflicting Tailwind classes", () => {
      expect(cn("p-2", "p-4", "text-center")).toBe("p-4 text-center");
    });

    it("should ignore falsy values when building class names", () => {
      expect(cn("btn", false && "btn-active", "text-sm", undefined, "bg-white")).toBe("btn text-sm bg-white");
    });
  });

  describe("runDeadlineScheduler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the automation endpoint and returns the response", async () => {
    const jsonMock = vi.fn().mockResolvedValue({ notifications_created: 5 });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: jsonMock });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runDeadlineScheduler();

    expect(fetchMock).toHaveBeenCalledWith("/api/automation/deadlines", { method: "POST" });
    expect(result).toEqual({ notifications_created: 5 });
  });

  it("returns an error object when the scheduler endpoint responds with a failure", async () => {
    const jsonMock = vi.fn().mockResolvedValue({ error: "Scheduler failed" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: jsonMock });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runDeadlineScheduler();

    expect(result).toEqual({ error: "Scheduler failed" });
  });
  });
});
