import { describe, expect, it } from "vitest";
import { classifyEvidenceMedia, getEvidenceTypeLabel } from "./evidence-utils";

describe("evidence media helpers", () => {
  it("classifies image uploads as photo media", () => {
    expect(classifyEvidenceMedia("image/jpeg")).toBe("photo");
  });

  it("classifies video uploads as video media", () => {
    expect(classifyEvidenceMedia("video/mp4")).toBe("video");
  });

  it("labels document types with a readable title", () => {
    expect(getEvidenceTypeLabel("photo", "image/jpeg")).toBe("Photo");
    expect(getEvidenceTypeLabel("video", "video/mp4")).toBe("Video");
    expect(getEvidenceTypeLabel("document", "application/pdf")).toBe("Document");
  });
});
