// ============================================================
// Amazon Product Advertising API v5 — NL marketplace.
//
// Vereist env vars:
//   AMAZON_PAAPI_ACCESS_KEY
//   AMAZON_PAAPI_SECRET_KEY
//   AMAZON_PAAPI_PARTNER_TAG  (valt terug op tiveaubusines-21)
//
// SigV4 signing implementatie — geen externe dep.
// ============================================================

import crypto from "crypto";

const HOST = "webservices.amazon.nl";
const REGION = "eu-west-1";
const SERVICE = "ProductAdvertisingAPI";
const MARKETPLACE = "www.amazon.nl";

export interface LivePAAPIItem {
  asin: string;
  title?: string;
  image?: string;
  price?: string;         // geformatteerde string "€29,95"
  priceAmount?: number;   // 29.95
  oldPrice?: string;
  savings?: string;       // "−25%"
  url: string;
  inStock: boolean;
  features?: string[];
  primeEligible?: boolean;
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function amzDate(d: Date): { amz: string; date: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso, date: iso.slice(0, 8) };
}

function signRequest(
  method: string,
  path: string,
  body: string,
  target: string,
  accessKey: string,
  secretKey: string,
): Record<string, string> {
  const now = new Date();
  const { amz, date } = amzDate(now);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amz}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    sha256Hex(body),
  ].join("\n");

  const credentialScope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amz,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac("AWS4" + secretKey, date);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    host: HOST,
    "x-amz-date": amz,
    "x-amz-target": target,
    authorization: authorization,
  };
}

// ============================================================
// GetItems — bulk-fetch op ASIN (tot 10 per request)
// ============================================================

export async function paapiGetItems(asins: string[]): Promise<LivePAAPIItem[]> {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG || "tiveaubusines-21";

  if (!accessKey || !secretKey) {
    throw new Error("AMAZON_PAAPI_ACCESS_KEY / _SECRET_KEY ontbreken");
  }
  if (asins.length === 0) return [];

  // Amazon accepteert max 10 per call — split in chunks
  const chunks: string[][] = [];
  for (let i = 0; i < asins.length; i += 10) chunks.push(asins.slice(i, i + 10));

  const results: LivePAAPIItem[] = [];
  for (const chunk of chunks) {
    const body = JSON.stringify({
      ItemIds: chunk,
      Resources: [
        "Images.Primary.Large",
        "Images.Primary.Medium",
        "ItemInfo.Title",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Offers.Listings.SavingBasis",
        "Offers.Listings.DeliveryInfo.IsPrimeEligible",
        "Offers.Listings.Availability.Type",
      ],
      PartnerTag: partnerTag,
      PartnerType: "Associates",
      Marketplace: MARKETPLACE,
    });

    const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
    const path = "/paapi5/getitems";
    const headers = signRequest("POST", path, body, target, accessKey, secretKey);

    const res = await fetch(`https://${HOST}${path}`, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`PA-API GetItems ${res.status}:`, text.slice(0, 500));
      continue;
    }

    const data = (await res.json()) as {
      ItemsResult?: { Items?: unknown[] };
      Errors?: Array<{ Code: string; Message: string }>;
    };
    if (data.Errors?.length) {
      console.warn("PA-API errors:", data.Errors.map(e => `${e.Code}: ${e.Message}`).join(" | "));
    }

    for (const raw of data.ItemsResult?.Items ?? []) {
      const parsed = parsePAAPIItem(raw);
      if (parsed) results.push(parsed);
    }
  }

  return results;
}

interface PAAPIRawItem {
  ASIN: string;
  DetailPageURL: string;
  Images?: { Primary?: { Large?: { URL: string }; Medium?: { URL: string } } };
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { DisplayAmount?: string; Amount?: number };
      SavingBasis?: { DisplayAmount?: string };
      DeliveryInfo?: { IsPrimeEligible?: boolean };
      Availability?: { Type?: string };
    }>;
  };
}

function parsePAAPIItem(raw: unknown): LivePAAPIItem | null {
  const r = raw as PAAPIRawItem;
  if (!r?.ASIN) return null;

  const listing = r.Offers?.Listings?.[0];
  const price = listing?.Price?.DisplayAmount;
  const priceAmount = listing?.Price?.Amount;
  const oldPrice = listing?.SavingBasis?.DisplayAmount;
  const availType = listing?.Availability?.Type ?? "";
  const inStock = ["Now", "IncludeOutOfStock"].includes(availType) || !!price;
  const primeEligible = listing?.DeliveryInfo?.IsPrimeEligible;

  let savings: string | undefined;
  if (oldPrice && priceAmount) {
    const oldNum = Number(oldPrice.replace(/[^\d,.]/g, "").replace(",", "."));
    if (oldNum > priceAmount) {
      savings = `−${Math.round((1 - priceAmount / oldNum) * 100)}%`;
    }
  }

  return {
    asin: r.ASIN,
    title: r.ItemInfo?.Title?.DisplayValue,
    image: r.Images?.Primary?.Large?.URL ?? r.Images?.Primary?.Medium?.URL,
    price,
    priceAmount,
    oldPrice,
    savings,
    url: r.DetailPageURL,
    inStock,
    features: r.ItemInfo?.Features?.DisplayValues,
    primeEligible,
  };
}

// ============================================================
// SearchItems — keyword-based (voor zoek-URL producten uit catalog)
// ============================================================

export async function paapiSearchItems(
  keywords: string,
  itemCount: number = 3,
): Promise<LivePAAPIItem[]> {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG || "tiveaubusines-21";

  if (!accessKey || !secretKey) {
    throw new Error("AMAZON_PAAPI_ACCESS_KEY / _SECRET_KEY ontbreken");
  }

  const body = JSON.stringify({
    Keywords: keywords,
    ItemCount: Math.min(10, Math.max(1, itemCount)),
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
      "Offers.Listings.Availability.Type",
    ],
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: MARKETPLACE,
    SortBy: "Relevance",
  });

  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const path = "/paapi5/searchitems";
  const headers = signRequest("POST", path, body, target, accessKey, secretKey);

  const res = await fetch(`https://${HOST}${path}`, { method: "POST", headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`PA-API SearchItems ${res.status}:`, text.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as { SearchResult?: { Items?: unknown[] } };
  const out: LivePAAPIItem[] = [];
  for (const raw of data.SearchResult?.Items ?? []) {
    const parsed = parsePAAPIItem(raw);
    if (parsed) out.push(parsed);
  }
  return out;
}
