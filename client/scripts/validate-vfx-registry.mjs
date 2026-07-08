import {
  REQUIRED_VFX_KEYS,
  VFX_ATTACK_KEYS,
  VFX_CARD_TYPES,
} from '../src/vfx/config/vfxRegistryKeys.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.resolve(__dirname, '../src/vfx/VFXRegistry.js');
const registrySource = await readFile(registryPath, 'utf8');

const literalRegisters = new Set(
  [...registrySource.matchAll(/registry\.register\(['"`]([^'"`]+)['"`]/g)]
    .map((match) => match[1])
);

const expectedKeys = new Set([
  ...VFX_CARD_TYPES.map((cardType) => `CARD_${cardType}`),
  ...VFX_ATTACK_KEYS,
  ...REQUIRED_VFX_KEYS,
]);

const hasCardTypeLoop = registrySource.includes('VFX_CARD_TYPES.forEach');
const hasAttackKeyLoop = registrySource.includes('VFX_ATTACK_KEYS.forEach');
const missingKeys = [...expectedKeys].filter((key) => {
  if (VFX_CARD_TYPES.some((cardType) => key === `CARD_${cardType}`)) {
    return !hasCardTypeLoop && !literalRegisters.has(key);
  }
  if (VFX_ATTACK_KEYS.includes(key)) {
    return !hasAttackKeyLoop && !literalRegisters.has(key);
  }
  return !literalRegisters.has(key);
});

if (missingKeys.length > 0) {
  if (missingKeys.length > 0) {
    console.error(`[vfx-registry] Missing keys: ${missingKeys.join(', ')}`);
  }
  process.exit(1);
}

console.log(`[vfx-registry] OK: ${expectedKeys.size} expected VFX keys covered.`);
