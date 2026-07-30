export type EvidenceMediaType = "photo" | "video" | "document";

export function classifyEvidenceMedia(fileType: string | null | undefined): EvidenceMediaType {
  if (!fileType) return "document";
  if (fileType.startsWith("image/")) return "photo";
  if (fileType.startsWith("video/")) return "video";
  return "document";
}

export function getEvidenceTypeLabel(mediaType: EvidenceMediaType | string, fileType?: string | null): string {
  if (mediaType === "photo") return "Photo";
  if (mediaType === "video") return "Video";
  return fileType && fileType.startsWith("image/") ? "Photo" : fileType && fileType.startsWith("video/") ? "Video" : "Document";
}
