// Minimal PNG metadata editor — strips metadata chunks and writes an `eXIf`
// chunk (PNG 1.5+ spec). Pixel data (IDAT) is never touched.

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Chunks considered "metadata" and removed on clean.
const META_TYPES = new Set([
  "eXIf",
  "tEXt",
  "zTXt",
  "iTXt",
  "tIME",
  "pHYs",
  "gAMA",
  "cHRM",
  "sRGB",
  "iCCP",
]);

// CRC32 (PNG polynomial) table.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Bytes): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Accept any backing buffer (subarray() yields ArrayBufferLike under TS strict).
type Bytes = Uint8Array<ArrayBufferLike>;

const enc = new TextEncoder();

function readType(buf: Bytes, off: number): string {
  return String.fromCharCode(buf[off], buf[off + 1], buf[off + 2], buf[off + 3]);
}

const u32 = (b: Bytes, o: number) =>
  ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function makeChunk(type: string, data: Bytes): Uint8Array {
  const typeBytes = enc.encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4); // len(4) + body + crc(4)
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set(body, 4);
  dv.setUint32(4 + body.length, crc32(body));
  return out;
}

function isPngSig(buf: Bytes): boolean {
  return SIG.every((b, i) => buf[i] === b);
}

interface Chunk {
  type: string;
  data: Bytes;
}

function parse(buf: Bytes): Chunk[] {
  const chunks: Chunk[] = [];
  let off = 8;
  while (off < buf.length) {
    const len = u32(buf, off);
    const type = readType(buf, off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 12 + len;
    if (type === "IEND") break;
  }
  return chunks;
}

function rebuild(chunks: Chunk[]): Uint8Array {
  const parts: Bytes[] = [new Uint8Array(SIG)];
  for (const c of chunks) parts.push(makeChunk(c.type, c.data));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** Remove metadata chunks. Optionally insert a fresh eXIf chunk (raw TIFF). */
export function writePngExif(
  bytes: Bytes,
  exifTiff?: Bytes
): Uint8Array {
  if (!isPngSig(bytes)) throw new Error("Not a valid PNG");
  const chunks = parse(bytes).filter((c) => !META_TYPES.has(c.type));
  if (exifTiff && exifTiff.length) {
    // Insert eXIf right after IHDR (first chunk).
    const idx = chunks.findIndex((c) => c.type === "IHDR");
    chunks.splice(idx + 1, 0, { type: "eXIf", data: exifTiff });
  }
  return rebuild(chunks);
}

export function isPng(bytes: Bytes): boolean {
  return isPngSig(bytes);
}
