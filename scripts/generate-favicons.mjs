import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src/app/icon.png");
const publicDir = join(root, "public");
const appDir = join(root, "src/app");

const sizes = [
  { name: "favicon-32x32.png", size: 32 },
  { name: "icon-48.png", size: 48 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

mkdirSync(publicDir, { recursive: true });

const pngBuffers = [];
for (const { name, size } of sizes) {
  const buffer = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, name), buffer);
  if (size === 32 || size === 48) {
    pngBuffers.push(buffer);
  }
}

const ico = await pngToIco(pngBuffers);
writeFileSync(join(publicDir, "favicon.ico"), ico);
writeFileSync(join(appDir, "favicon.ico"), ico);
copyFileSync(source, join(appDir, "apple-icon.png"));

console.log("Generated favicon assets from src/app/icon.png");
