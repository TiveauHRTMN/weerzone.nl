import "server-only";
import proj4 from "proj4";
import { PNG } from "pngjs";
import { RADAR_BOUNDS } from "@/lib/knmi-radar-bounds";

export { RADAR_BOUNDS };

/**
 * KNMI neerslagradar → kaartklare PNG.
 *
 * KNMI levert de nationale neerslagcomposiet als HDF5 (RAD_NL25_PCP_NA): een
 * 765×700 grid in poolstereografische projectie, 1×1 km, elke 5 minuten. Hier
 * downloaden + parsen we dat, en herprojecteren naar Web-Mercator zodat het
 * exact over een Leaflet-basemap valt. Pixelwaarde → dBZ via de kalibratie in
 * het bestand, dBZ → kleur.
 *
 * Alles cache-bewust (s-maxage 300) en zonder LLM — veilig op schaal.
 */

const ODA_BASE = "https://api.dataplatform.knmi.nl/open-data/v1";
const DATASET = "radar_reflectivity_composites";
const VERSION = "2.0";

// Brongrid (uit het HDF5: geographic + map_projection). Constant per product.
const SRC_COLS = 700;
const SRC_ROWS = 765;
const STEREO = "+proj=stere +lat_0=90 +lon_0=0 +lat_ts=60 +a=6378137 +b=6356752 +x_0=0 +y_0=0 +units=km";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";
const MERC = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +units=m +no_defs"; // EPSG:3857
// Upper-left hoek in stereografische km (geprojecteerd uit geo_product_corners).
const UL_X = 0;
const UL_Y = -3650;
// Kalibratie uit het bestand: GEO(dBZ) = 0.5 * PV - 32.
const CAL_GAIN = 0.5;
const CAL_OFFSET = -32;

// Uitvoer-bounding box komt uit knmi-radar-bounds (gedeeld met de client).
const OUT_W = 720;

const toMerc = (lon: number, lat: number) => proj4(WGS84, MERC, [lon, lat]) as [number, number];
const mercToLonLat = (x: number, y: number) => proj4(MERC, WGS84, [x, y]) as [number, number];
const toStereo = (lon: number, lat: number) => proj4(WGS84, STEREO, [lon, lat]) as [number, number];

/** dBZ → RGBA (afgestemd op de bestaande ReflectivityMap-schaal). */
function dbzColor(dbz: number): [number, number, number, number] {
  if (dbz < 7) return [0, 0, 0, 0];
  if (dbz < 12) return [0x93, 0xc5, 0xfd, 150]; // licht
  if (dbz < 20) return [0x60, 0xa5, 0xfa, 180];
  if (dbz < 28) return [0x25, 0x63, 0xeb, 205];
  if (dbz < 34) return [0x16, 0xa3, 0x4a, 220]; // groen
  if (dbz < 40) return [0xfa, 0xcc, 0x15, 230]; // geel
  if (dbz < 46) return [0xf9, 0x73, 0x16, 240]; // oranje
  if (dbz < 52) return [0xdc, 0x26, 0x26, 248]; // rood
  if (dbz < 56) return [0x99, 0x1b, 0x1b, 252];
  return [0x7e, 0x22, 0xce, 255]; // extreem
}

export interface RadarRender {
  png: Buffer;
  width: number;
  height: number;
  /** ISO-tijd van de radarcompositie. */
  time: string | null;
  bounds: typeof RADAR_BOUNDS;
}

/**
 * De afbeelding output-pixel → bron-grid-index is constant (vaste bbox +
 * projectie). We berekenen de dure proj4-herprojectie daarom één keer per proces
 * en cachen de lookup; warme calls doen alleen nog HDF5-parse + tabel-lookup.
 */
let lookupCache: { width: number; height: number; srcIdx: Int32Array } | null = null;

function buildLookup() {
  if (lookupCache) return lookupCache;
  const [mxW] = toMerc(RADAR_BOUNDS.west, RADAR_BOUNDS.south);
  const [mxE] = toMerc(RADAR_BOUNDS.east, RADAR_BOUNDS.north);
  const myS = toMerc(RADAR_BOUNDS.west, RADAR_BOUNDS.south)[1];
  const myN = toMerc(RADAR_BOUNDS.east, RADAR_BOUNDS.north)[1];
  const width = OUT_W;
  const height = Math.round(OUT_W * (myN - myS) / (mxE - mxW));
  const srcIdx = new Int32Array(width * height);
  for (let j = 0; j < height; j++) {
    const my = myN - ((j + 0.5) / height) * (myN - myS);
    for (let i = 0; i < width; i++) {
      const mx = mxW + ((i + 0.5) / width) * (mxE - mxW);
      const [lon, lat] = mercToLonLat(mx, my);
      const [sx, sy] = toStereo(lon, lat);
      const col = sx - UL_X;
      const row = UL_Y - sy;
      srcIdx[j * width + i] =
        col >= 0 && col < SRC_COLS && row >= 0 && row < SRC_ROWS
          ? (row | 0) * SRC_COLS + (col | 0)
          : -1;
    }
  }
  lookupCache = { width, height, srcIdx };
  return lookupCache;
}

async function fetchLatestHdf5(): Promise<{ bytes: Uint8Array; time: string | null } | null> {
  const key = process.env.KNMI_ODA_API_KEY || process.env.KNMI_API_KEY;
  if (!key) return null;
  const headers = { Authorization: key };

  const listRes = await fetch(
    `${ODA_BASE}/datasets/${DATASET}/versions/${VERSION}/files?orderBy=lastModified&sorting=desc&maxKeys=1`,
    { headers, next: { revalidate: 240 } },
  );
  if (!listRes.ok) return null;
  const file = (await listRes.json())?.files?.[0];
  if (!file?.filename) return null;

  const urlRes = await fetch(
    `${ODA_BASE}/datasets/${DATASET}/versions/${VERSION}/files/${encodeURIComponent(file.filename)}/url`,
    { headers, next: { revalidate: 240 } },
  );
  if (!urlRes.ok) return null;
  const dl: string | undefined = (await urlRes.json())?.temporaryDownloadUrl;
  if (!dl) return null;

  const res = await fetch(dl, { next: { revalidate: 240 } });
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());

  // Tijd uit de bestandsnaam: RAD_NL25_PCP_NA_YYYYMMDDhhmm.h5
  const m = file.filename.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  const time = m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z` : null;
  return { bytes, time };
}

async function parseGrid(bytes: Uint8Array): Promise<Uint8Array | null> {
  const h5wasm = await import("h5wasm");
  const { FS } = await h5wasm.ready;
  const name = `radar_${Date.now()}_${Math.random().toString(36).slice(2)}.h5`;
  FS.writeFile(name, bytes);
  try {
    const f = new h5wasm.File(name, "r");
    try {
      const img = f.get("image1/image_data") as { value: ArrayLike<number> } | null;
      if (!img) return null;
      return Uint8Array.from(img.value as ArrayLike<number>);
    } finally {
      f.close();
    }
  } finally {
    try { FS.unlink(name); } catch { /* noop */ }
  }
}

/** Download → parse → herprojecteer naar Web-Mercator → PNG. `null` bij uitval. */
export async function renderKnmiRadar(): Promise<RadarRender | null> {
  const latest = await fetchLatestHdf5();
  if (!latest) return null;
  const grid = await parseGrid(latest.bytes);
  if (!grid) return null;

  const { width, height, srcIdx } = buildLookup();
  const png = new PNG({ width, height });
  for (let p = 0; p < srcIdx.length; p++) {
    const out = p << 2;
    const src = srcIdx[p];
    if (src >= 0) {
      const pv = grid[src];
      if (pv > 0 && pv < 255) {
        const [r, g, b, a] = dbzColor(CAL_GAIN * pv + CAL_OFFSET);
        png.data[out] = r; png.data[out + 1] = g; png.data[out + 2] = b; png.data[out + 3] = a;
        continue;
      }
    }
    png.data[out + 3] = 0; // transparant
  }

  const buffer = PNG.sync.write(png);
  return { png: buffer, width, height, time: latest.time, bounds: RADAR_BOUNDS };
}
