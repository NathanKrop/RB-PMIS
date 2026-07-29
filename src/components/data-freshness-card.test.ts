// Unit tests for component-level helper exports used in dashboard freshness UI.
// This file verifies the DataFreshnessCard helper behavior independently of React rendering.
import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "@/components/data-freshness-card";

describe("formatTimeAgo", () => {
  it("returns a human readable age in minutes", () => {
    const nowMs = new Date("2026-07-30T12:00:00Z").getTime();
    const result = formatTimeAgo("2026-07-30T11:55:00Z", nowMs);
    expect(result).toBe("5m ago");
  });

  it("returns a human readable age in hours", () => {
    const nowMs = new Date("2026-07-30T12:00:00Z").getTime();
    const result = formatTimeAgo("2026-07-30T09:00:00Z", nowMs);
    expect(result).toBe("3h ago");
  });

  it("returns a human readable age in days", () => {
    const nowMs = new Date("2026-07-30T12:00:00Z").getTime();
    const result = formatTimeAgo("2026-07-28T12:00:00Z", nowMs);
    expect(result).toBe("2d ago");
  });
});
