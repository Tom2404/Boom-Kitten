const crypto = require('crypto');
const sharp = require('sharp');
const Asset = require('../../models/Asset');
const { storageDriver } = require('./storageProvider');

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

const VALID_CATEGORIES = new Set([
  'protector',
  'avatar_frame',
  'field',
  'skin',
  'emote',
  'misc',
]);

function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Process and save image buffer to storage and database
 */
async function processAndSaveAsset({ buffer, originalName, mimeType, category = 'misc', userId }) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Định dạng tệp không được hỗ trợ: ${mimeType}. Chỉ chấp nhận PNG, JPG, WebP, SVG, GIF.`);
  }

  const normalizedCategory = VALID_CATEGORIES.has(category) ? category : 'misc';
  const hash = calculateHash(buffer);

  // Anti-duplication check: If asset with same hash exists and is active, return existing
  const existingAsset = await Asset.findOne({ hash, isArchived: false });
  if (existingAsset) {
    return {
      asset: existingAsset,
      reused: true,
    };
  }

  const dateFolder = new Date().toISOString().slice(0, 7); // YYYY-MM
  const subfolder = `shop/${normalizedCategory}/${dateFolder}`;
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const baseFilename = `${hash.slice(0, 10)}_${randomSuffix}`;

  let fullBuffer = buffer;
  let thumbBuffer = buffer;
  let width = 0;
  let height = 0;
  let finalMimeType = mimeType;

  // Process raster images with Sharp (convert to WebP quality 85)
  if (mimeType !== 'image/svg+xml') {
    const sharpImage = sharp(buffer);
    const metadata = await sharpImage.metadata();
    width = metadata.width || 0;
    height = metadata.height || 0;

    // Convert full image to WebP with quality 85
    fullBuffer = await sharpImage
      .webp({ quality: 85 })
      .toBuffer();

    // Create thumbnail 128x128 max
    thumbBuffer = await sharp(buffer)
      .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    finalMimeType = 'image/webp';
  }

  const fullFilename = `${baseFilename}.webp`;
  const thumbFilename = `${baseFilename}_thumb.webp`;

  const fullSave = await storageDriver.saveFile({
    subfolder,
    filename: fullFilename,
    buffer: fullBuffer,
  });

  const thumbSave = await storageDriver.saveFile({
    subfolder,
    filename: thumbFilename,
    buffer: thumbBuffer,
  });

  const asset = await Asset.create({
    filename: fullFilename,
    originalName: originalName || fullFilename,
    mimeType: finalMimeType,
    width,
    height,
    size: fullBuffer.length,
    hash,
    category: normalizedCategory,
    variants: {
      fullUrl: fullSave.publicUrl,
      thumbUrl: thumbSave.publicUrl,
    },
    uploadedBy: userId || null,
    usageCount: 0,
    isArchived: false,
  });

  return {
    asset,
    reused: false,
  };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  VALID_CATEGORIES,
  calculateHash,
  processAndSaveAsset,
};
