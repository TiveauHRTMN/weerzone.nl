import { deflateSync, inflateSync } from "zlib";
import { normalizePng } from "../src/lib/mariana/studio/png-normalize";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * Builds a genuine adaptively-filtered PNG (real PNG-spec filter ENCODING per row,
 * cycling through all 5 filter types), split across many small IDAT chunks like a
 * browser canvas export. Ground-truth pixels are known (a deterministic pattern),
 * so decoding the normalized output can be checked against them exactly, for every
 * row/filter type — not just filter type 0.
 */
function buildAdaptivePng(width: number, height: number, bpp: 3 | 4) {
  const rowBytes = width * bpp;
  const groundTruth = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = y * rowBytes + x * bpp;
      groundTruth[px] = (x * 7 + y * 3) & 0xff;
      groundTruth[px + 1] = (x * 11 + y * 5) & 0xff;
      groundTruth[px + 2] = (x * 3 + y * 17) & 0xff;
      if (bpp === 4) groundTruth[px + 3] = (x + y * 2 + 30) & 0xff;
    }
  }

  const raw = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    const filterType = y % 5; // cycle through None/Sub/Up/Average/Paeth
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = filterType;
    for (let x = 0; x < rowBytes; x++) {
      const raw_x = groundTruth[y * rowBytes + x];
      const a = x >= bpp ? groundTruth[y * rowBytes + x - bpp] : 0; // left
      const b = y > 0 ? groundTruth[(y - 1) * rowBytes + x] : 0; // above
      const c = y > 0 && x >= bpp ? groundTruth[(y - 1) * rowBytes + x - bpp] : 0; // above-left
      let filtered: number;
      if (filterType === 0) filtered = raw_x;
      else if (filterType === 1) filtered = (raw_x - a) & 0xff;
      else if (filterType === 2) filtered = (raw_x - b) & 0xff;
      else if (filterType === 3) filtered = (raw_x - ((a + b) >> 1)) & 0xff;
      else filtered = (raw_x - paethPredictor(a, b, c)) & 0xff;
      raw[rowStart + 1 + x] = filtered;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(bpp === 4 ? 6 : 2, 9);
  const compressed = deflateSync(raw, { level: 6 });
  // Split into many small IDAT chunks, mirroring a browser canvas export's shape.
  const idatChunks: Buffer[] = [];
  const chunkSize = 20;
  for (let i = 0; i < compressed.length; i += chunkSize) {
    idatChunks.push(chunk("IDAT", compressed.subarray(i, i + chunkSize)));
  }
  const png = Buffer.concat([sig, chunk("IHDR", ihdrData), ...idatChunks, chunk("IEND", Buffer.alloc(0))]);
  return { png, groundTruth, rowBytes };
}

function decodeSingleIdatPixels(png: Buffer): Buffer {
  let offset = 8;
  const idatParts: Buffer[] = [];
  while (offset < png.length) {
    const len = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") idatParts.push(png.subarray(offset + 8, offset + 8 + len));
    offset += 8 + len + 4;
    if (type === "IEND") break;
  }
  const raw = inflateSync(Buffer.concat(idatParts));
  // Normalized output is always filter type 0 (None), so pixel bytes are the raw bytes verbatim.
  return raw;
}

(async () => {
  const W = 16, H = 10;
  const { png: input, groundTruth, rowBytes } = buildAdaptivePng(W, H, 4);

  function countIdat(buf: Buffer): number {
    let offset = 8, count = 0;
    while (offset < buf.length) {
      const len = buf.readUInt32BE(offset);
      const type = buf.toString("ascii", offset + 4, offset + 8);
      if (type === "IDAT") count++;
      offset += 8 + len + 4;
      if (type === "IEND") break;
    }
    return count;
  }
  assert(countIdat(input) > 1, "input PNG has multiple IDAT chunks (mirrors browser export)");

  const output = normalizePng(input);
  assert(output.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "output has valid PNG signature");
  assert(countIdat(output) === 1, "normalized output has exactly one IDAT chunk");

  // Pixel-exact fidelity across ALL rows/filter types (0=None,1=Sub,2=Up,3=Average,4=Paeth),
  // not just the trivial filter-type-0 case.
  const decodedRaw = decodeSingleIdatPixels(output);
  let allRowsMatch = true;
  let firstMismatchRow = -1;
  for (let y = 0; y < H; y++) {
    const rowStart = y * (rowBytes + 1);
    assert(decodedRaw[rowStart] === 0, `row ${y}: normalized output uses filter type None`);
    const pixelBytes = decodedRaw.subarray(rowStart + 1, rowStart + 1 + rowBytes);
    const expected = groundTruth.subarray(y * rowBytes, (y + 1) * rowBytes);
    if (!pixelBytes.equals(expected)) {
      allRowsMatch = false;
      firstMismatchRow = y;
      break;
    }
  }
  assert(allRowsMatch, `pixel-exact fidelity for every row/filter type (0-4)${firstMismatchRow >= 0 ? `, first mismatch at row ${firstMismatchRow} (filter type ${firstMismatchRow % 5})` : ""}`);

  // Idempotency: re-normalizing an already-clean PNG produces byte-identical output.
  const output2 = normalizePng(output);
  assert(output2.equals(output), "normalizing an already-normalized PNG is idempotent");

  // RGB (no alpha, colorType 2) path — same defilter logic, different bpp.
  const { png: rgbInput, groundTruth: rgbTruth, rowBytes: rgbRowBytes } = buildAdaptivePng(12, 7, 3);
  const rgbOutput = normalizePng(rgbInput);
  const rgbDecoded = decodeSingleIdatPixels(rgbOutput);
  let rgbMatch = true;
  for (let y = 0; y < 7; y++) {
    const rowStart = y * (rgbRowBytes + 1);
    const pixelBytes = rgbDecoded.subarray(rowStart + 1, rowStart + 1 + rgbRowBytes);
    const expected = rgbTruth.subarray(y * rgbRowBytes, (y + 1) * rgbRowBytes);
    if (!pixelBytes.equals(expected)) { rgbMatch = false; break; }
  }
  assert(rgbMatch, "RGB (colorType 2, no alpha) pixel-exact fidelity across all filter types");

  // Invalid input falls back cleanly (throws, doesn't hang or crash the process).
  let threw = false;
  try {
    normalizePng(Buffer.from("not a png"));
  } catch {
    threw = true;
  }
  assert(threw, "invalid PNG signature throws (caller falls back to original bytes)");

  console.log("ALL PASS");
})();
