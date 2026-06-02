import { buildStaticSitemap, xmlResponse } from "@/lib/sitemap-data";

export const revalidate = 43200;

export function GET() {
  return xmlResponse(buildStaticSitemap());
}
