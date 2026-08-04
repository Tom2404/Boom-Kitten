const TournamentParticipant = require('../../models/TournamentParticipant');
const { ApiError } = require('../../utils/apiResponse');
const { refundCancelledTournamentEntries } = require('../tournamentPlayerService');

function buildTournamentRefundPreview(tournament, participants) {
  if (!tournament || tournament.status !== 'cancelled') {
    throw new ApiError(409, 'STATE_CONFLICT', 'Chỉ giải đã hủy mới có thể preview hoàn Coin.');
  }
  const rows = participants.filter((participant) => participant.paymentStatus === 'paid');
  return {
    tournamentId: String(tournament._id),
    recipients: rows.length,
    totalCoins: rows.reduce((sum, participant) => sum + (Number(participant.entryFeePaid) || 0), 0),
  };
}

async function createTournamentRefundPreview({ TournamentModel, ParticipantModel = TournamentParticipant, tournamentId }) {
  const query = TournamentModel.findById(tournamentId);
  const tournament = await (query?.lean ? query.lean() : query);
  if (!tournament) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy giải đấu.');
  const participantsQuery = ParticipantModel.find({ tournamentId });
  const participants = await (participantsQuery?.lean ? participantsQuery.lean() : participantsQuery);
  return buildTournamentRefundPreview(tournament, participants);
}

module.exports = {
  buildTournamentRefundPreview,
  createTournamentRefundPreview,
  refundCancelledTournamentEntries,
};
