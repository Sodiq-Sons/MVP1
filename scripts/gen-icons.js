// Generates solid-color PNG icons for the PWA manifest — no extra deps required
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// CRC-32 (required by PNG spec)
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[i] = c;
}
function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const tb = Buffer.from(type, "ascii");
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(data.length);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
    return Buffer.concat([len, tb, data, crcBuf]);
}

function makePNG(size, r, g, b) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // RGB colour type

    // Raw scanlines: filter-byte(0) + RGB pixels
    const rowLen = 1 + size * 3;
    const raw = Buffer.alloc(size * rowLen);
    for (let y = 0; y < size; y++) {
        const base = y * rowLen;
        // filter byte = 0 (None) already set by Buffer.alloc
        for (let x = 0; x < size; x++) {
            raw[base + 1 + x * 3] = r;
            raw[base + 1 + x * 3 + 1] = g;
            raw[base + 1 + x * 3 + 2] = b;
        }
    }

    return Buffer.concat([
        sig,
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });

// Camp Connect brand orange: #F97316
const [R, G, B] = [249, 115, 22];

for (const s of sizes) {
    fs.writeFileSync(path.join(dir, `icon-${s}x${s}.png`), makePNG(s, R, G, B));
    console.log(`✓ icon-${s}x${s}.png`);
}
console.log("Done — replace with real branded icons before launch.");
