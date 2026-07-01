// Generates three favicon files from a single SVG source:
//   public/icon.svg            -> the SVG source (vector, theme-aware)
//   public/favicon.ico         -> multi-resolution ICO (16+32+48 PNG-encoded)
//   public/apple-touch-icon.png -> 180x180 PNG
//
// Visual: dark-navy rounded square with a "K" monogram in accent blue.
// Matches the site's existing color tokens (--accent: 37 99 235 in light mode,
// 59 130 246 in dark mode) and the dark mesh background (#070b1a).
//
// Run: node scripts/make-icons.cjs

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "public");
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// 1) SVG source — used directly as /icon.svg
// ---------------------------------------------------------------------------
// 64x64 viewBox; scales crisply to any size. The "K" is drawn as a vertical
// bar plus two diagonal polygons, which renders identically across browsers
// and embeds cleanly into an ICO without font dependencies.
const ACCENT = "#2563eb"; // rgb(37 99 235) — site --accent
const BG = "#070b1a"; // site background mesh colour
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="K">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0b1224"/>
      <stop offset="1" stop-color="#070b1a"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="64" height="64" rx="14" ry="14" fill="url(#bg)"/>
  <!-- Subtle accent ring so the favicon reads at 16x16 -->
  <rect x="1.25" y="1.25" width="61.5" height="61.5" rx="12.75" ry="12.75"
        fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="1.25"/>
  <!-- Vertical bar of the K -->
  <rect x="18" y="16" width="6" height="32" rx="1.5" fill="${ACCENT}"/>
  <!-- Upper diagonal of the K (top-right to mid) -->
  <polygon points="24,32 42,16 47,16 30,32" fill="${ACCENT}"/>
  <!-- Lower diagonal of the K (mid to bottom-right) -->
  <polygon points="30,32 47,48 42,48 24,32" fill="${ACCENT}"/>
</svg>
`;
fs.writeFileSync(path.join(OUT, "icon.svg"), svg, "utf8");
console.log("wrote public/icon.svg", svg.length, "bytes");

// ---------------------------------------------------------------------------
// 2) Rasterise the SVG into a NxN RGBA buffer using a hand-rolled painter.
// ---------------------------------------------------------------------------
function makeIconPng(size) {
  const s = size / 64;
  const radius = 14 * s;
  const rgba = new Uint8Array(size * size * 4);

  function setPx(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    const aN = a / 255;
    const aC = rgba[i + 3] / 255;
    const aOut = aN + aC * (1 - aN);
    if (aOut === 0) return;
    rgba[i] = (r * aN + rgba[i] * aC * (1 - aN)) / aOut;
    rgba[i + 1] = (g * aN + rgba[i + 1] * aC * (1 - aN)) / aOut;
    rgba[i + 2] = (b * aN + rgba[i + 2] * aC * (1 - aN)) / aOut;
    rgba[i + 3] = aOut * 255;
  }

  function fillRoundedRect(x0, y0, w, h, r, color) {
    const [cr, cg, cb] = color;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(size, Math.ceil(y0 + h)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(size, Math.ceil(x0 + w)); x++) {
        const px = x + 0.5, py = y + 0.5;
        const cx = Math.min(Math.max(px, x0 + r), x0 + w - r);
        const cy = Math.min(Math.max(py, y0 + r), y0 + h - r);
        const dx = px - cx, dy = py - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= r - 0.5) {
          setPx(x, y, cr, cg, cb, 255);
        } else if (d <= r + 0.5) {
          const t = 1 - Math.max(0, Math.min(1, d - (r - 0.5)));
          setPx(x, y, cr, cg, cb, t * 255);
        }
      }
    }
  }

  function fillPolygon(pts, color) {
    const [cr, cg, cb] = color;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of pts) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    minX = Math.max(0, Math.floor(minX));
    minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(size - 1, Math.ceil(maxX));
    maxY = Math.min(size - 1, Math.ceil(maxY));

    function inTri(px, py, a, b, c) {
      const v0x = c[0] - a[0], v0y = c[1] - a[1];
      const v1x = b[0] - a[0], v1y = b[1] - a[1];
      const v2x = px - a[0], v2y = py - a[1];
      const dot00 = v0x * v0x + v0y * v0y;
      const dot01 = v0x * v1x + v0y * v1y;
      const dot02 = v0x * v2x + v0y * v2y;
      const dot11 = v1x * v1x + v1y * v1y;
      const dot12 = v1x * v2x + v1y * v2y;
      const denom = dot00 * dot11 - dot01 * dot01;
      if (denom === 0) return false;
      const u = (dot11 * dot02 - dot01 * dot12) / denom;
      const v = (dot00 * dot12 - dot01 * dot02) / denom;
      return u >= 0 && v >= 0 && u + v <= 1;
    }

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        if (inTri(px, py, pts[0], pts[1], pts[2]) || inTri(px, py, pts[0], pts[2], pts[3])) {
          setPx(x, y, cr, cg, cb, 255);
        }
      }
    }
  }

  // 1) Rounded square with diagonal gradient background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5, py = y + 0.5;
      const cx = Math.min(Math.max(px, radius), size - radius);
      const cy = Math.min(Math.max(py, radius), size - radius);
      const dx = px - cx, dy = py - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        const t = (x + y) / (2 * size);
        const r1 = 0x0b, g1 = 0x12, b1 = 0x24;
        const r2 = 0x07, g2 = 0x0b, b2 = 0x1a;
        const r = r1 + (r2 - r1) * t;
        const g = g1 + (g2 - g1) * t;
        const b = b1 + (b2 - b1) * t;
        setPx(x, y, r, g, b, 255);
      } else {
        rgba[(y * size + x) * 4 + 3] = 0;
      }
    }
  }

  // 2) Subtle accent ring inside the rounded square
  const ringW = 1.25 * s;
  const inset = 1.25 * s;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5, py = y + 0.5;
      const cx = Math.min(Math.max(px, radius), size - radius);
      const cy = Math.min(Math.max(py, radius), size - radius);
      const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const target = radius - inset - ringW / 2;
      if (Math.abs(d - target) <= ringW / 2 + 0.5) {
        const i = (y * size + x) * 4;
        const a = 0.35;
        if (rgba[i + 3] > 0) {
          rgba[i] = rgba[i] * (1 - a) + 0x25 * a;
          rgba[i + 1] = rgba[i + 1] * (1 - a) + 0x63 * a;
          rgba[i + 2] = rgba[i + 2] * (1 - a) + 0xeb * a;
        }
      }
    }
  }

  const ACCENT_RGB = [0x25, 0x63, 0xeb];

  // 3) Vertical bar
  fillRoundedRect(18 * s, 16 * s, 6 * s, 32 * s, 1.5 * s, ACCENT_RGB);
  // 4) Upper diagonal
  fillPolygon(
    [
      [24 * s, 32 * s],
      [42 * s, 16 * s],
      [47 * s, 16 * s],
      [30 * s, 32 * s],
    ],
    ACCENT_RGB,
  );
  // 5) Lower diagonal
  fillPolygon(
    [
      [30 * s, 32 * s],
      [47 * s, 48 * s],
      [42 * s, 48 * s],
      [24 * s, 32 * s],
    ],
    ACCENT_RGB,
  );

  return encodePng(rgba, size, size);
}

// ---------------------------------------------------------------------------
// 3) Minimal PNG encoder (RGBA, 8-bit, no interlace)
// ---------------------------------------------------------------------------
function encodePng(rgba, width, height) {
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const scanline = width * 4;
  const raw = Buffer.alloc(height * (scanline + 1));
  // Copy each scanline from the Uint8Array into the raw buffer.
  for (let y = 0; y < height; y++) {
    raw[y * (scanline + 1)] = 0;
    const src = Buffer.from(rgba.buffer, rgba.byteOffset + y * scanline, scanline);
    src.copy(raw, y * (scanline + 1) + 1, 0, scanline);
  }
  const idatData = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
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
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) | 0;
}

// ---------------------------------------------------------------------------
// 4) Minimal ICO encoder (PNG-encoded frames)
// ---------------------------------------------------------------------------
function encodeIco(sizes) {
  const count = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + dir.length;
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const sz = s.size;
    dir.writeUInt8(sz >= 256 ? 0 : sz, i * 16 + 0);
    dir.writeUInt8(sz >= 256 ? 0 : sz, i * 16 + 1);
    dir.writeUInt8(0, i * 16 + 2);
    dir.writeUInt8(0, i * 16 + 3);
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(s.png.length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += s.png.length;
  }

  return Buffer.concat([header, dir, ...sizes.map((s) => s.png)]);
}

// ---------------------------------------------------------------------------
// 5) Generate the assets
// ---------------------------------------------------------------------------
const png16 = makeIconPng(16);
const png32 = makeIconPng(32);
const png48 = makeIconPng(48);
const png180 = makeIconPng(180);

fs.writeFileSync(path.join(OUT, "favicon.ico"), encodeIco([
  { size: 16, png: png16 },
  { size: 32, png: png32 },
  { size: 48, png: png48 },
]));
fs.writeFileSync(path.join(OUT, "apple-touch-icon.png"), png180);

console.log(
  "wrote public/favicon.ico (16+32+48 PNG-in-ICO):",
  fs.statSync(path.join(OUT, "favicon.ico")).size, "bytes",
);
console.log(
  "wrote public/apple-touch-icon.png (180x180):",
  fs.statSync(path.join(OUT, "apple-touch-icon.png")).size, "bytes",
);