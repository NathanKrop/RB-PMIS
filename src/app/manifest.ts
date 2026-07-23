import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "RB-PMIS", short_name: "RB-PMIS", description: "Results-based programme management information system", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#18181b" };
}
