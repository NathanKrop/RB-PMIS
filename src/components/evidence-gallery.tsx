import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye } from "lucide-react";
import type { Evidence } from "@/lib/types";

export interface EvidenceGalleryItem extends Evidence {
  preview_url?: string | null;
  activities?: { description: string } | null;
  users?: { full_name: string | null; email: string; departments?: { name: string } | null } | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreview(fileType: string) {
  return ["image/", "video/", "application/pdf"].some((prefix) => fileType.startsWith(prefix));
}

export function EvidenceGallery({ items }: { items: EvidenceGalleryItem[] }) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No evidence uploaded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium leading-snug">{item.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{item.file_type} · {formatBytes(item.file_size)}</p>
              </div>
              <Badge className="capitalize text-xs" variant={item.verification_status === "verified" ? "success" : item.verification_status === "pending" ? "warning" : item.verification_status === "rejected" ? "destructive" : "outline"}>
                {item.verification_status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.caption && <p className="text-sm">{item.caption}</p>}
            {item.activities?.description && (
              <p className="text-xs text-muted-foreground">Linked activity: {item.activities.description}</p>
            )}
            {item.users?.departments?.name && (
              <p className="text-xs text-muted-foreground">Department: {item.users.departments.name}</p>
            )}
            <p className="text-xs text-muted-foreground">Uploaded: {new Date(item.created_at).toLocaleDateString()}</p>
            <div className="flex flex-wrap gap-2">
              {item.preview_url && canPreview(item.file_type) && (
                <a
                  href={item.preview_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </a>
              )}
              {item.preview_url && (
                <a
                  href={item.preview_url}
                  download
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
              {!item.preview_url && (
                <span className="text-xs text-muted-foreground">Preview unavailable</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
