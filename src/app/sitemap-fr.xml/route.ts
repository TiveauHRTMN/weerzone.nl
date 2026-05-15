import { buildFRSitemap, xmlResponse } from "@/lib/sitemap-data";

export const revalidate = 86400;

export function GET() {
  return xmlResponse(buildFRSitemap());
}
