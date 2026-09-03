const express = require('express');
const multer = require('multer');
const Asset = require('../models/Asset');
const ShopItem = require('../models/ShopItem');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requireAdminPermission, requireAnyAdminPermission } = require('../middleware/adminMiddleware');
const { processAndSaveAsset } = require('../services/admin/assetService');
const { ApiError } = require('../utils/apiResponse');

const router = express.Router();

// Multer memory storage configuration with 5MB file size limit per file (supports bulk up to 10 files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Helper: Find ShopItems referencing an asset URL
 */
async function findAssetShopUsage(asset) {
  if (!asset) return [];
  const urls = [
    asset.variants?.fullUrl,
    asset.variants?.thumbUrl,
  ].filter(Boolean);

  if (!urls.length) return [];

  return await ShopItem.find({
    $or: [
      { imageUrl: { $in: urls } },
      { previewUrl: { $in: urls } },
    ],
  }).select('_id name type price rarity isActive');
}

/**
 * GET /api/admin/assets
 * Query and list assets with category filter, search, sorting, and pagination
 */
router.get('/', requireAnyAdminPermission('asset.read', 'catalog.read'), async (req, res, next) => {
  try {
    const { category, search, sort = 'newest', page = 1, limit = 20, includeArchived = 'false' } = req.query;
    const query = {};

    if (includeArchived !== 'true') {
      query.isArchived = false;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name') sortOption = { originalName: 1 };
    if (sort === 'usage') sortOption = { usageCount: -1, createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [assets, total] = await Promise.all([
      Asset.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Asset.countDocuments(query),
    ]);

    return res.json({
      data: assets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/admin/assets/:id/usage
 * Usage Detection API - Find which ShopItems reference this asset
 */
router.get('/:id/usage', requireAnyAdminPermission('asset.read', 'catalog.read'), async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      throw new ApiError(404, 'ASSET_NOT_FOUND', 'Không tìm thấy tài nguyên.');
    }

    const items = await findAssetShopUsage(asset);
    if (asset.usageCount !== items.length) {
      asset.usageCount = items.length;
      await asset.save();
    }

    return res.json({
      assetId: asset._id,
      usageCount: items.length,
      usedByItems: items,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/admin/assets
 * Bulk Upload asset files (up to 10 files)
 */
router.post(
  '/',
  requireAnyAdminPermission('asset.write', 'catalog.write'),
  upload.array('files', 10),
  async (req, res, next) => {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      if (!files.length) {
        throw new ApiError(400, 'NO_FILE_UPLOADED', 'Không tìm thấy tệp được tải lên.');
      }

      const category = req.body?.category || 'misc';
      const results = [];

      for (const file of files) {
        const outcome = await processAndSaveAsset({
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          category,
          userId: req.admin?.id,
        });

        results.push({
          _id: outcome.asset._id,
          filename: outcome.asset.filename,
          originalName: outcome.asset.originalName,
          category: outcome.asset.category,
          fullUrl: outcome.asset.variants.fullUrl,
          thumbUrl: outcome.asset.variants.thumbUrl,
          width: outcome.asset.width,
          height: outcome.asset.height,
          size: outcome.asset.size,
          reused: outcome.reused,
        });
      }

      return res.status(201).json({
        success: true,
        data: results.length === 1 ? results[0] : results,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * PATCH /api/admin/assets/:id
 * Update asset metadata (originalName, category, tags, isArchived)
 */
router.patch('/:id', requireAdminPermission('asset.write'), async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      throw new ApiError(404, 'ASSET_NOT_FOUND', 'Không tìm thấy tài nguyên.');
    }

    const { originalName, category, tags, isArchived } = req.body;
    if (originalName !== undefined) asset.originalName = String(originalName).trim();
    if (category !== undefined) asset.category = String(category);
    if (Array.isArray(tags)) asset.tags = tags.map(String);
    if (isArchived !== undefined) asset.isArchived = Boolean(isArchived);

    await asset.save();
    return res.json({ success: true, data: asset });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/admin/assets/:id
 * Soft Delete / Archive Asset with Usage Detection check
 */
router.delete('/:id', requireAdminPermission('asset.delete'), async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      throw new ApiError(404, 'ASSET_NOT_FOUND', 'Không tìm thấy tài nguyên.');
    }

    const items = await findAssetShopUsage(asset);
    asset.usageCount = items.length;
    asset.isArchived = true;
    await asset.save();

    return res.json({
      success: true,
      message: items.length > 0
        ? `Tài nguyên đang được dùng bởi ${items.length} vật phẩm. Đã chuyển sang trạng thái lưu trữ (Archived) an toàn.`
        : 'Đã lưu trữ tài nguyên thành công.',
      usageCount: items.length,
      data: asset,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
