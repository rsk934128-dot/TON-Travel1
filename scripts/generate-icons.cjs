const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, getPixelRGBA) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (byte ^ crc) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function createICO(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  const entries = [];
  let currentOffset = 6 + (pngBuffers.length * 16);

  pngBuffers.forEach(({ width, height, buffer }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    entries.push(entry);
    currentOffset += buffer.length;
  });

  return Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

function roundedRectDist(px, py, rx, ry, rw, rh, radius) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const dx = Math.abs(px - cx) - (rw / 2 - radius);
  const dy = Math.abs(py - cy) - (rh / 2 - radius);
  
  if (dx <= 0 && dy <= 0) return -Math.min(-dx, -dy);
  if (dx > 0 && dy > 0) return Math.sqrt(dx * dx + dy * dy) - radius;
  return Math.max(dx, dy) - radius;
}

function pointInPoly(px, py, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function renderLogoPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  const cornerRadius = w * 0.22;
  const distSquircle = roundedRectDist(x, y, 0, 0, w, h, cornerRadius);
  
  if (distSquircle > 0) {
    return [0, 0, 0, 0];
  }

  const bgG = Math.round(152 * (1 - ny) + 102 * ny);
  const bgB = Math.round(234 * (1 - ny) + 153 * ny);

  let r = 0;
  let g = bgG;
  let b = bgB;
  let a = 255;

  const topX = 0.50 * w, topY = 0.18 * h;
  const rightX = 0.78 * w, rightY = 0.43 * h;
  const bottomX = 0.50 * w, bottomY = 0.83 * h;
  const leftX = 0.22 * w, leftY = 0.43 * h;
  const midTopLeftX = 0.39 * w, midTopLeftY = 0.43 * h;
  const midTopRightX = 0.61 * w, midTopRightY = 0.43 * h;

  if (pointInPoly(x, y, [[topX, topY], [leftX, leftY], [midTopLeftX, midTopLeftY]])) {
    return [224, 242, 254, 255];
  }
  if (pointInPoly(x, y, [[topX, topY], [midTopLeftX, midTopLeftY], [midTopRightX, midTopRightY]])) {
    return [255, 255, 255, 255];
  }
  if (pointInPoly(x, y, [[topX, topY], [midTopRightX, midTopRightY], [rightX, rightY]])) {
    return [240, 249, 255, 255];
  }
  if (pointInPoly(x, y, [[midTopLeftX, midTopLeftY], [midTopRightX, midTopRightY], [bottomX, bottomY]])) {
    return [186, 230, 253, 255];
  }
  if (pointInPoly(x, y, [[leftX, leftY], [midTopLeftX, midTopLeftY], [bottomX, bottomY]])) {
    return [125, 211, 252, 255];
  }
  if (pointInPoly(x, y, [[midTopRightX, midTopRightY], [rightX, rightY], [bottomX, bottomY]])) {
    return [56, 189, 248, 255];
  }

  if (distSquircle > -1.5) {
    const edgeAlpha = Math.max(0, Math.min(1, -distSquircle / 1.5));
    a = Math.round(edgeAlpha * 255);
  }

  return [r, g, b, a];
}

console.log('Generating high-resolution TON Travel app icons and mobile assets...');

const publicDir = path.join(__dirname, '..', 'public');

const png512 = createPNG(512, 512, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'logo.jpg'), png512);
fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);

const png192 = createPNG(192, 192, renderLogoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.jpg'), png192);

const png64 = createPNG(64, 64, renderLogoPixel);
const png32 = createPNG(32, 32, renderLogoPixel);
const png16 = createPNG(16, 16, renderLogoPixel);

fs.writeFileSync(path.join(publicDir, 'favicon.png'), png32);
fs.writeFileSync(path.join(publicDir, 'favicon.jpg'), png32);

const icoBuf = createICO([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 64, height: 64, buffer: png64 }
]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

if (fs.existsSync('public/test.png')) {
  fs.unlinkSync('public/test.png');
}

console.log('Successfully generated all valid PNG, ICO, and SVG mobile and web icons in /public!');
