import { createClient } from "@/lib/supabase/server";

export async function createEvidenceSignedUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("evidence").createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
