/**
 * Mariana Studio — normaliseert een PNG naar één schone IDAT-chunk met filter-type
 * "None" per scanline.
 *
 * html-to-image's browser-canvas-export produceert een geldige maar "vreemd"
 * gestructureerde PNG (honderden losse IDAT-chunks, adaptieve per-scanline
 * PNG-filters) die generieke viewers/decoders en TikTok's eigen app prima
 * accepteren, maar die Buffer/TikTok's PULL_FROM_URL-mediacontainer-aanmaak
 * consistent laat falen met "The request post info is empty or incorrect" —
 * geverifieerd live: dezelfde pixels, herencoded via deze functie, publiceren
 * wél succesvol. Alleen 8-bit, non-interlaced RGB(A) input wordt ondersteund
 * (exact wat toPng() altijd produceert); bij twijfel gooit dit een Error zodat
 * de aanroeper op de originele bytes kan terugvallen i.p.v. te crashen.
 */

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

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function normalizePng(input: Buffer): Buffer {
  const zlib = require("zlib") as typeof import("zlib");

  if (!input.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("Geen geldige PNG-signature");

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idatParts: Buffer[] = [];
  while (offset < input.length) {
    const len = input.readUInt32BE(offset);
    const type = input.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (type === "IHDR") {
      width = input.readUInt32BE(dataStart);
      height = input.readUInt32BE(dataStart + 4);
      bitDepth = input.readUInt8(dataStart + 8);
      colorType = input.readUInt8(dataStart + 9);
      interlace = input.readUInt8(dataStart + 12);
    } else if (type === "IDAT") {
      idatParts.push(input.subarray(dataStart, dataStart + len));
    }
    offset = dataStart + len + 4;
    if (type === "IEND") break;
  }

  if (bitDepth !== 8) throw new Error(`Onverwachte bitDepth ${bitDepth} (alleen 8 ondersteund)`);
  if (interlace !== 0) throw new Error("Interlaced PNG niet ondersteund");
  if (colorType !== 2 && colorType !== 6) throw new Error(`Onverwacht colorType ${colorType} (alleen RGB/RGBA ondersteund)`);

  const bpp = colorType === 6 ? 4 : 3;
  const rowBytes = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  if (raw.length !== (1 + rowBytes) * height) throw new Error("Onverwachte gedecomprimeerde grootte — corrupte of onverwachte PNG");

  // Defilter elke scanline naar ruwe pixel-bytes.
  const pixels = Buffer.alloc(rowBytes * height);
  let prevRow = Buffer.alloc(rowBytes);
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (rowBytes + 1)];
    const rowStart = y * (rowBytes + 1) + 1;
    const curRow = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= bpp ? curRow[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      const rawByte = raw[rowStart + x];
      let val: number;
      if (filterType === 0) val = rawByte;
      else if (filterType === 1) val = (rawByte + a) & 0xff;
      else if (filterType === 2) val = (rawByte + b) & 0xff;
      else if (filterType === 3) val = (rawByte + ((a + b) >> 1)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        val = (rawByte + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      } else throw new Error(`Onbekend PNG-filtertype ${filterType}`);
      curRow[x] = val;
    }
    curRow.copy(pixels, y * rowBytes);
    prevRow = curRow;
  }

  // Herencodeer als één schone IDAT-chunk met filter-type "None" per scanline.
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(colorType, 9);
  const outRaw = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    outRaw[y * (rowBytes + 1)] = 0;
    pixels.copy(outRaw, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const idat = chunk("IDAT", zlib.deflateSync(outRaw, { level: 6 }));

  return Buffer.concat([PNG_SIGNATURE, chunk("IHDR", ihdrData), idat, chunk("IEND", Buffer.alloc(0))]);
}
