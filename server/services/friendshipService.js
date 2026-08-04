const { ApiError } = require('../utils/apiResponse');

function relationshipQuery(leftId, rightId) {
  return { $or: [{ requester: leftId, recipient: rightId }, { requester: rightId, recipient: leftId }] };
}

async function sendFriendRequest({ actorId, targetId, UserModel, FriendshipModel }) {
  if (!targetId || String(actorId) === String(targetId)) throw new ApiError(422, 'VALIDATION_ERROR', 'Không thể kết bạn với chính mình.');
  if (!(await UserModel.exists({ _id: targetId, role: 'user', deletedAt: null, isBanned: false }))) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy người chơi.');
  const friendship = await FriendshipModel.findOne(relationshipQuery(actorId, targetId));
  if (!friendship) return FriendshipModel.create({ requester: actorId, recipient: targetId, status: 'pending', actionUser: actorId });
  if (friendship.status === 'accepted') return friendship;
  if (friendship.status === 'blocked' && String(friendship.actionUser) === String(targetId)) throw new ApiError(403, 'FORBIDDEN', 'Không thể gửi lời mời tới người chơi này.');
  if (friendship.status === 'pending') {
    if (String(friendship.actionUser) === String(actorId)) return friendship;
    throw new ApiError(409, 'STATE_CONFLICT', 'Người chơi này đã gửi lời mời cho bạn. Hãy chấp nhận trong inbox.');
  }
  friendship.requester = actorId;
  friendship.recipient = targetId;
  friendship.status = 'pending';
  friendship.actionUser = actorId;
  await friendship.save();
  return friendship;
}

async function acceptFriendRequest({ actorId, requesterId, FriendshipModel }) {
  const friendship = await FriendshipModel.findOne({ requester: requesterId, recipient: actorId, status: 'pending' });
  if (!friendship || String(friendship.actionUser) !== String(requesterId)) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy lời mời kết bạn.');
  friendship.status = 'accepted';
  friendship.actionUser = actorId;
  await friendship.save();
  return friendship;
}

async function declineFriendRequest({ actorId, requesterId, FriendshipModel }) {
  const friendship = await FriendshipModel.findOne({ requester: requesterId, recipient: actorId, status: 'pending' });
  if (!friendship || String(friendship.actionUser) !== String(requesterId)) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy lời mời kết bạn.');
  friendship.status = 'declined';
  friendship.actionUser = actorId;
  await friendship.save();
  return friendship;
}

async function assertCanInviteFriend({ inviterId, friendId, room, FriendshipModel }) {
  if (!room || room.status !== 'waiting' || !room.players.some((player) => String(player.userId) === String(inviterId))) {
    throw new ApiError(409, 'STATE_CONFLICT', 'Bạn phải ở trong một phòng đang chờ để mời bạn bè.');
  }
  if (room.players.some((player) => String(player.userId) === String(friendId))) throw new ApiError(409, 'STATE_CONFLICT', 'Người chơi đã ở trong phòng.');
  const accepted = await FriendshipModel.exists({ ...relationshipQuery(inviterId, friendId), status: 'accepted' });
  if (!accepted) throw new ApiError(403, 'FORBIDDEN', 'Chỉ có thể mời bạn bè đã chấp nhận.');
}

module.exports = { acceptFriendRequest, assertCanInviteFriend, declineFriendRequest, relationshipQuery, sendFriendRequest };
