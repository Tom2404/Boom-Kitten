import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OPTIONAL_VFX_ASSET_URLS,
  REQUIRED_VFX_ASSET_URLS,
} from '../src/vfx/config/vfxAssets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');

function assetPathFromUrl(url) {
  return path.join(clientRoot, 'public', url.replace(/^\//, ''));
}

function readPngInfo(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    return { isPng: false, hasAlpha: false };
  }

  const colorType = buffer.readUInt8(25);
  let offset = 8;
  let hasTrnsChunk = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'tRNS') {
      hasTrnsChunk = true;
      break;
    }
    offset += 12 + length;
  }

  return {
    isPng: true,
    hasAlpha: colorType === 4 || colorType === 6 || hasTrnsChunk,
  };
}

let failed = false;

for (const url of REQUIRED_VFX_ASSET_URLS) {
  const filePath = assetPathFromUrl(url);
  if (!fs.existsSync(filePath)) {
    failed = true;
    console.error(`[vfx-assets] Missing required asset: ${url}`);
    continue;
  }

  const info = readPngInfo(filePath);
  if (!info.isPng) {
    failed = true;
    console.error(`[vfx-assets] Required asset is not a PNG: ${url}`);
  } else if (!info.hasAlpha) {
    failed = true;
    console.error(`[vfx-assets] Required overlay asset has no PNG alpha channel: ${url}`);
  }
}

for (const url of OPTIONAL_VFX_ASSET_URLS) {
  const filePath = assetPathFromUrl(url);
  if (!fs.existsSync(filePath)) {
    console.warn(`[vfx-assets] Optional asset not found, code fallback will be used: ${url}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`[vfx-assets] OK: ${REQUIRED_VFX_ASSET_URLS.length} required VFX assets validated.`);
