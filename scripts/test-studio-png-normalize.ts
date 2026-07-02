import { deflateSync } from "zlib";
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
// Build a small multi-IDAT-chunk RGBA PNG using adaptive (non-zero) filter types,
// mirroring the structural shape of a browser canvas export, to exercise the
// defilter logic for filter types 1-4 (not just the common "None" case).
function buildAdaptivePng(width: number, height: number): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9); // RGBA
  const bpp = 4;
  const rowBytes = width * bpp;
  const raw = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    const filterType = y % 5; // cycle through all 5 filter types across rows
    raw[y * (rowBytes + 1)] = filterType;
    for (let x = 0; x < width; x++) {
      const px = y * (rowBytes + 1) + 1 + x * bpp;
      // Encode filter type 0 (None) values directly for simplicity of ground truth,
      // then only row 0 (guaranteed filterType 0) is checked pixel-exact below.
      raw[px] = (x * 7 + y * 3) & 0xff;
      raw[px + 1] = (x * 11) & 0xff;
      raw[px + 2] = (y * 13) & 0xff;
      raw[px + 3] = 255;
    }
  }
  // Split into multiple small IDAT chunks (like a browser export) instead of one.
  const compressed = deflateSync(raw, { level: 6 });
  const idatChunks: Buffer[] = [];
  const chunkSize = 20;
  for (let i = 0; i < compressed.length; i += chunkSize) {
    idatChunks.push(chunk("IDAT", compressed.subarray(i, i + chunkSize)));
  }
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, chunk("IHDR", ihdrData), ...idatChunks, iend]);
}

(async () => {
  // 1. Multi-chunk PNG with filterType 0 on row 0 round-trips exactly on that row.
  const W = 16, H = 10;
  const input = buildAdaptivePng(W, H);
  const output = normalizePng(input);

  assert(output.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "output has valid PNG signature");

  // Count IDAT chunks in output — should be exactly 1 (normalized), vs many in input.
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
  assert(countIdat(output) === 1, "normalized output has exactly one IDAT chunk");

  // Round-trip: normalize twice should be idempotent (re-normalizing an already-clean PNG works).
  const output2 = normalizePng(output);
  assert(output2.equals(output), "normalizing an already-normalized PNG is idempotent");

  // 2. Pixel fidelity: decode the normalized output ourselves and check row 0 (filterType 0, known values).
  {
    const zlib = require("zlib");
    let offset = 8;
    const idatParts: Buffer[] = [];
    while (offset < output.length) {
      const len = output.readUInt32BE(offset);
      const type = output.toString("ascii", offset + 4, offset + 8);
      if (type === "IDAT") idatParts.push(output.subarray(offset + 8, offset + 8 + len));
      offset += 8 + len + 4;
      if (type === "IEND") break;
    }
    const raw = zlib.inflateSync(Buffer.concat(idatParts));
    const rowBytes = W * 4;
    // row 0 in the input used filterType 0, so its pixel values are exactly what we wrote.
    let pixelsMatch = true;
    for (let x = 0; x < W; x++) {
      const px = 1 + x * 4; // filter byte + offset
      if (raw[px] !== ((x * 7 + 0 * 3) & 0xff) || raw[px + 1] !== ((x * 11) & 0xff) || raw[px + 2] !== 0 || raw[px + 3] !== 255) {
        pixelsMatch = false;
        break;
      }
    }
    assert(pixelsMatch, "row 0 pixel values preserved exactly through normalize");
  }

  // 3. Invalid input falls back cleanly (throws, doesn't hang or crash the process).
  let threw = false;
  try {
    normalizePng(Buffer.from("not a png"));
  } catch {
    threw = true;
  }
  assert(threw, "invalid PNG signature throws (caller falls back to original bytes)");

  console.log("ALL PASS");
})();
