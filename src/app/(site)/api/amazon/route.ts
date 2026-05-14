import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Cache for 1 hour
export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.amazon.nl/s?k=${encodeURIComponent(q).replace(/%20/g, "+")}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Amazon responded with ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: any[] = [];

    // Select standard Amazon search result items
    $(".s-result-item[data-component-type='s-search-result']").each((i, el) => {
      if (i >= 5) return; // limit to 5

      const titleEl = $(el).find("h2 a span");
      const title = titleEl.text().trim();

      const imageEl = $(el).find("img.s-image");
      const image = imageEl.attr("src");

      // Extract price
      const priceWhole = $(el).find(".a-price-whole").first().text().replace(",", "").trim();
      const priceFraction = $(el).find(".a-price-fraction").first().text().trim();
      const price = priceWhole ? `€${priceWhole},${priceFraction || "00"}` : "";

      if (title && image && price) {
        products.push({
          title,
          image,
          price,
          brand: "Amazon.nl", 
          // We let the client build the actual affiliate tracking url via the keyword,
          // or we give the direct search URL. It's safer to just point to the search,
          // or we can extract the ASIN and build a direct link!
          asin: $(el).attr("data-asin"),
        });
      }
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Amazon scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
