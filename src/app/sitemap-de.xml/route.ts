import { buildDESitemap, xmlResponse } from "@/lib/sitemap-data";

export const revalidate = 3600;

export function GET() {
  return xmlResponse(buildDESitemap("west"));
}
