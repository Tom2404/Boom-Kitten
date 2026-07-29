const mongoose = require('mongoose');
const User = require('../models/User');
const Wager = require('../models/Wager');
const Transaction = require('../models/Transaction');
const { allocateWagerPot, buildLockedParticipants, validateStake } = require('./wagerService');

async function inTransaction(work, startSession = () => mongoose.startSession()) {
  const session = await startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

async function lockWager({
  roomCode, reference = roomCode, players, stake, requestId,
  UserModel = User, WagerModel = Wager, TransactionModel = Transaction, startSession,
}) {
  validateStake(stake);
  if (stake === 0) return null;
  const participants = buildLockedParticipants(players, stake);
  return inTransaction(async (session) => {
    const replay = await WagerModel.findOne({ reference, state: 'locked', lockRequestId: requestId }).session(session);
    if (replay) return replay;
    const existing = await WagerModel.findOne({ reference }).session(session);
    if (existing) throw new Error(`Wager room ${roomCode} already has ledger state ${existing.state}`);

    for (const participant of participants) {
      const before = await UserModel.findOneAndUpdate(
        { _id: participant.userId, coins: { $gte: stake } },
        { $inc: { coins: -stake } },
        { new: false, session },
      );
      if (!before) throw new Error('Một số người chơi không đủ Coin để khóa cược');
      await TransactionModel.create([{
        userId: participant.userId,
        type: 'wager_lock',
        amount: stake,
        currency: 'coin',
        balanceBefore: before.coins,
        balanceAfter: before.coins - stake,
        source: `wager:${roomCode}`,
        description: `Locked wager for room ${roomCode}`,
      }], { session });
    }
    const [wager] = await WagerModel.create([{
      reference,
      roomCode,
      stake,
      state: 'locked',
      participants,
      lockRequestId: requestId,
      lockedAt: new Date(),
    }], { session });
    return wager;
  }, startSession);
}

async function settleWager({
  roomCode, reference = roomCode, placements, requestId,
  UserModel = User, WagerModel = Wager, TransactionModel = Transaction, startSession,
}) {
  return inTransaction(async (session) => {
    const replay = await WagerModel.findOne({ reference, state: 'settled', settlementRequestId: requestId }).session(session);
    if (replay) return replay;
    const wager = await WagerModel.findOne({ reference, state: 'locked' }).session(session);
    if (!wager) throw new Error(`No locked wager for room ${roomCode}`);
    const payouts = allocateWagerPot(placements, wager.stake);
    for (const row of payouts.filter((item) => item.payout > 0)) {
      const before = await UserModel.findByIdAndUpdate(row.userId, { $inc: { coins: row.payout } }, { new: false, session });
      if (!before) throw new Error(`Missing wager participant ${row.userId}`);
      await TransactionModel.create([{
        userId: row.userId, type: 'wager_payout', amount: row.payout, currency: 'coin',
        balanceBefore: before.coins, balanceAfter: before.coins + row.payout,
        source: `wager:${roomCode}`, description: `Wager payout for room ${roomCode}`,
      }], { session });
    }
    const payoutByUser = new Map(payouts.map((row) => [String(row.userId), row]));
    wager.participants.forEach((participant) => {
      const payout = payoutByUser.get(String(participant.userId));
      participant.placement = payout?.placement;
      participant.payoutCoins = payout?.payout || 0;
    });
    wager.state = 'settled';
    wager.settlementRequestId = requestId;
    wager.settledAt = new Date();
    return wager.save({ session });
  }, startSession);
}

async function refundWager({
  roomCode, reference = roomCode, requestId, reason,
  UserModel = User, WagerModel = Wager, TransactionModel = Transaction, startSession,
}) {
  return inTransaction(async (session) => {
    const replay = await WagerModel.findOne({ reference, state: 'refunded', refundRequestId: requestId }).session(session);
    if (replay) return replay;
    const wager = await WagerModel.findOne({ reference, state: { $in: ['locked', 'review_required'] } }).session(session);
    if (!wager) throw new Error(`No locked wager for room ${roomCode}`);
    for (const participant of wager.participants) {
      const before = await UserModel.findByIdAndUpdate(participant.userId, { $inc: { coins: participant.lockedCoins } }, { new: false, session });
      await TransactionModel.create([{
        userId: participant.userId, type: 'wager_refund', amount: participant.lockedCoins, currency: 'coin',
        balanceBefore: before.coins, balanceAfter: before.coins + participant.lockedCoins,
        source: `wager:${roomCode}`, description: reason || `Wager refund for room ${roomCode}`,
      }], { session });
    }
    wager.state = 'refunded';
    wager.refundRequestId = requestId;
    wager.refundReason = reason;
    wager.refundedAt = new Date();
    return wager.save({ session });
  }, startSession);
}

async function markWagerReview({ reference, reason, WagerModel = Wager }) {
  return WagerModel.findOneAndUpdate(
    { reference, state: 'locked' },
    { $set: { state: 'review_required', reviewReason: String(reason || 'Settlement failed').slice(0, 1000) } },
    { new: true },
  );
}

module.exports = { inTransaction, lockWager, markWagerReview, refundWager, settleWager };
