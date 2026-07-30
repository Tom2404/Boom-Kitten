const { ApiError } = require('../utils/apiResponse');

const SHOPPABLE_TYPES = Object.freeze(['protector', 'avatar_frame', 'field']);
const SLOT_TO_TYPE = Object.freeze({
  protector: 'protector',
  avatarFrame: 'avatar_frame',
  field: 'field',
});

function isSafeAssetUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const url = value.trim();
  if (url.startsWith('/')) return !url.startsWith('//');
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function isItemAvailableForPurchase(item, now = new Date()) {
  if (!item || item.isActive === false || !SHOPPABLE_TYPES.includes(item.type)) return false;
  return !item.isLimited || (item.availableUntil && new Date(item.availableUntil) >= now);
}

function toPublicCosmetic(item) {
  if (!item) return null;
  const value = item.toObject ? item.toObject() : item;
  const id = String(value._id);
  const imageUrl = isSafeAssetUrl(value.imageUrl) ? value.imageUrl.trim() : '';
  const previewUrl = isSafeAssetUrl(value.previewUrl) ? value.previewUrl.trim() : '';
  return {
    _id: id,
    id,
    name: value.name,
    type: value.type,
    rarity: value.rarity || 'common',
    imageUrl,
    previewUrl,
    assetUrl: previewUrl || imageUrl,
  };
}

function buildEquippedCosmetics(equipped = {}, items = []) {
  const byId = new Map(items.map((item) => [String(item._id), item]));
  return Object.fromEntries(Object.keys(SLOT_TO_TYPE).map((slot) => {
    const id = equipped?.[slot];
    return [slot, id ? toPublicCosmetic(byId.get(String(id))) : null];
  }));
}

function toPlayerPresentation(user, fallbackUsername = 'Guest') {
  const populatedFrame = user?.equippedCosmetics?.avatarFrame;
  const populatedProtector = user?.equippedCosmetics?.protector;
  const frame = populatedFrame?.name ? toPublicCosmetic(populatedFrame) : null;
  const protector = populatedProtector?.name ? toPublicCosmetic(populatedProtector) : null;
  return {
    username: user?.username || fallbackUsername,
    avatar: user?.avatar || '',
    avatarFrame: frame ? {
      id: frame.id,
      name: frame.name,
      rarity: frame.rarity,
      assetUrl: frame.assetUrl,
    } : null,
    protector: protector ? {
      id: protector.id,
      name: protector.name,
      rarity: protector.rarity,
      assetUrl: protector.assetUrl,
    } : null,
  };
}

async function resolveUserEquipment(user, ShopItemModel, knownItems = []) {
  const equipped = user?.equippedCosmetics || {};
  const ids = Object.keys(SLOT_TO_TYPE).map((slot) => equipped?.[slot]).filter(Boolean);
  let items = knownItems;
  if (ids.length && typeof ShopItemModel.find === 'function') {
    items = await ShopItemModel.find({ _id: { $in: ids } });
  }
  return buildEquippedCosmetics(equipped, items);
}

async function equipCosmetic({ userId, slot, itemId, UserModel, ShopItemModel }) {
  const expectedType = SLOT_TO_TYPE[slot];
  if (!expectedType) throw new ApiError(422, 'INVALID_EQUIPMENT_SLOT', 'Slot trang bị không hợp lệ.');

  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
  if (!user.equippedCosmetics) user.equippedCosmetics = {};

  if (itemId === null || itemId === undefined || itemId === '') {
    user.equippedCosmetics[slot] = null;
    if (slot === 'avatarFrame') user.activeAvatarFrame = '';
    await user.save();
    return resolveUserEquipment(user, ShopItemModel);
  }

  const item = await ShopItemModel.findById(itemId);
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Không tìm thấy vật phẩm.');
  if (item.type !== expectedType) {
    throw new ApiError(422, 'SLOT_TYPE_MISMATCH', 'Loại vật phẩm không khớp slot trang bị.');
  }
  if (!(user.ownedItemIds || []).some((ownedId) => String(ownedId) === String(item._id))) {
    throw new ApiError(409, 'ITEM_NOT_OWNED', 'Bạn chưa sở hữu vật phẩm này.');
  }

  user.equippedCosmetics[slot] = item._id;
  if (slot === 'avatarFrame') user.activeAvatarFrame = item.name;
  await user.save();
  return resolveUserEquipment(user, ShopItemModel, [item]);
}

async function purchaseCosmetic({
  userId,
  itemId,
  UserModel,
  ShopItemModel,
  TransactionModel,
  now = new Date(),
}) {
  const item = await ShopItemModel.findById(itemId);
  if (!item) throw new ApiError(404, 'ITEM_NOT_FOUND', 'Không tìm thấy vật phẩm.');
  if (!isItemAvailableForPurchase(item, now)) {
    throw new ApiError(409, 'ITEM_NOT_AVAILABLE', 'Vật phẩm hiện không được bán.');
  }

  const coinPrice = (item.price?.coins ?? 0) + (item.price?.gems ?? 0) * 50;
  const updateFields = {
    $inc: { coins: -coinPrice },
    $addToSet: { ownedItemIds: item._id },
  };
  if (item.type === 'avatar_frame') updateFields.$addToSet.ownedAvatarFrames = item.name;

  const user = await UserModel.findOneAndUpdate({
    _id: userId,
    coins: { $gte: coinPrice },
    ownedItemIds: { $ne: item._id },
  }, updateFields, { new: true });

  if (!user) {
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) throw new ApiError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
    if ((currentUser.ownedItemIds || []).some((ownedId) => String(ownedId) === String(item._id))) {
      throw new ApiError(409, 'ITEM_ALREADY_OWNED', 'Bạn đã sở hữu vật phẩm này.');
    }
    throw new ApiError(409, 'INSUFFICIENT_FUNDS', 'Số dư không đủ để thực hiện giao dịch.');
  }

  if (coinPrice > 0) {
    await TransactionModel.create({
      userId: user._id,
      type: 'purchase',
      amount: coinPrice,
      currency: 'coin',
      source: `shop:${item._id}`,
      description: `Purchased ${item.name}`,
    });
  }
  return { success: true, coins: user.coins, item: toPublicCosmetic(item) };
}

module.exports = {
  SHOPPABLE_TYPES,
  SLOT_TO_TYPE,
  buildEquippedCosmetics,
  equipCosmetic,
  isItemAvailableForPurchase,
  isSafeAssetUrl,
  purchaseCosmetic,
  resolveUserEquipment,
  toPlayerPresentation,
  toPublicCosmetic,
};
