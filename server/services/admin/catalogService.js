const ShopItem = require('../../models/ShopItem');
const User = require('../../models/User');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');
const { isSafeAssetUrl, normalizeAssetTransform } = require('../shopEquipmentService');

const CATALOG_FIELDS = ['name', 'description', 'type', 'price', 'rarity', 'isLimited', 'availableUntil', 'imageUrl', 'previewUrl', 'assetTransform', 'isActive', 'sortOrder'];

function toPlain(value) {
  return value?.toObject ? value.toObject() : value;
}

function selectCatalogFields(input, { defaults = false } = {}) {
  const payload = {};
  for (const field of CATALOG_FIELDS) {
    if (input[field] !== undefined) payload[field] = input[field];
  }
  if (defaults) {
    if (payload.price === undefined) payload.price = { coins: 0 };
    if (payload.rarity === undefined) payload.rarity = 'common';
    if (payload.isLimited === undefined) payload.isLimited = false;
    if (payload.imageUrl === undefined) payload.imageUrl = '';
    if (payload.previewUrl === undefined) payload.previewUrl = '';
    if (payload.assetTransform === undefined) payload.assetTransform = normalizeAssetTransform();
    if (payload.isActive === undefined) payload.isActive = true;
    if (payload.sortOrder === undefined) payload.sortOrder = 0;
  }
  if (payload.price !== undefined) payload.price = { coins: Number(payload.price?.coins) || 0 };
  if (payload.assetTransform !== undefined) payload.assetTransform = normalizeAssetTransform(payload.assetTransform);
  return payload;
}

function validateCatalogInput(input) {
  if (!input.name || !input.type) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Tên và loại vật phẩm là bắt buộc.', {
      fields: { ...(!input.name && { name: 'Bắt buộc' }), ...(!input.type && { type: 'Bắt buộc' }) },
    });
  }
  if (input.price?.coins !== undefined && (!Number.isFinite(Number(input.price.coins)) || Number(input.price.coins) < 0)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Giá Coin không hợp lệ.', { fields: { 'price.coins': 'Không được âm' } });
  }
  const unsafeAssetFields = ['imageUrl', 'previewUrl'].filter((field) => input[field] && !isSafeAssetUrl(input[field]));
  if (unsafeAssetFields.length) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'URL asset không hợp lệ.', {
      fields: Object.fromEntries(unsafeAssetFields.map((field) => [field, 'Chỉ hỗ trợ đường dẫn asset nội bộ cùng origin bắt đầu bằng /'])),
    });
  }
}

async function createCatalogItem({ CatalogModel = ShopItem, AuditLogModel, audit = createAdminAudit, actor, input, mutation, request = {} }) {
  validateCatalogInput(input);
  const item = await CatalogModel.create(selectCatalogFields(input, { defaults: true }));
  await audit({
    AuditLogModel,
    actor,
    action: 'CATALOG_ITEM_CREATED',
    target: { type: 'shop_item', id: String(item._id) },
    after: toPlain(item),
    reason: mutation.reason || 'Created catalog item',
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return item;
}

async function updateCatalogItem({ CatalogModel = ShopItem, audit = createAdminAudit, actor, itemId, input, mutation, request = {} }) {
  validateCatalogInput(input);
  const before = await CatalogModel.findById(itemId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy vật phẩm.');
  const item = await CatalogModel.findOneAndUpdate(
    { _id: itemId, __v: before.__v },
    { $set: selectCatalogFields(input), $inc: { __v: 1 } },
    { new: true, runValidators: true },
  );
  if (!item) throw new ApiError(409, 'STATE_CONFLICT', 'Vật phẩm đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'CATALOG_ITEM_UPDATED',
    target: { type: 'shop_item', id: String(item._id) },
    before: toPlain(before),
    after: toPlain(item),
    reason: mutation.reason || 'Updated catalog item',
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return item;
}

async function setCatalogItemStatus({ CatalogModel = ShopItem, audit = createAdminAudit, actor, itemId, isActive, mutation, request = {} }) {
  if (typeof isActive !== 'boolean') throw new ApiError(422, 'VALIDATION_ERROR', 'Trạng thái vật phẩm không hợp lệ.');
  const before = await CatalogModel.findById(itemId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy vật phẩm.');
  const item = await CatalogModel.findOneAndUpdate(
    { _id: itemId, __v: before.__v },
    { $set: { isActive }, $inc: { __v: 1 } },
    { new: true, runValidators: true },
  );
  if (!item) throw new ApiError(409, 'STATE_CONFLICT', 'Vật phẩm đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'CATALOG_ITEM_STATUS_CHANGED',
    target: { type: 'shop_item', id: String(item._id) },
    before: { isActive: before.isActive, version: before.__v },
    after: { isActive: item.isActive, version: item.__v },
    reason: mutation.reason || 'Changed catalog availability',
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return item;
}

async function deleteCatalogItem({
  CatalogModel = ShopItem,
  UserModel = User,
  audit = createAdminAudit,
  actor,
  itemId,
  mutation,
  request = {},
}) {
  const before = await CatalogModel.findById(itemId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy vật phẩm.');
  const referenceFilters = [
    { ownedItemIds: itemId },
    { 'equippedCosmetics.protector': itemId },
    { 'equippedCosmetics.avatarFrame': itemId },
    { 'equippedCosmetics.field': itemId },
  ];
  if (before.type === 'avatar_frame') {
    referenceFilters.push(
      { ownedAvatarFrames: before.name },
      { activeAvatarFrame: before.name },
    );
  }
  const inUse = await UserModel.exists({
    $or: referenceFilters,
  });
  if (inUse) {
    throw new ApiError(409, 'CATALOG_ITEM_IN_USE', 'Vật phẩm đang được sở hữu hoặc trang bị. Hãy tắt bán thay vì xóa.');
  }
  const result = await CatalogModel.deleteOne({ _id: itemId, __v: before.__v });
  if (result.deletedCount !== 1) throw new ApiError(409, 'STATE_CONFLICT', 'Vật phẩm đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'CATALOG_ITEM_DELETED',
    target: { type: 'shop_item', id: String(before._id) },
    before: toPlain(before),
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
}

module.exports = {
  createCatalogItem,
  deleteCatalogItem,
  selectCatalogFields,
  setCatalogItemStatus,
  updateCatalogItem,
};
