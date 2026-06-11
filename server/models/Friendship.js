// Friendship schema manages user relationships: friend requests and blocks.
const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      required: true,
      default: 'pending',
    },
    // The user who performed the last action (useful for tracking who sent request / who blocked)
    actionUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Prevent duplicate relationship records
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Optimize lookup queries for a user's friend list
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model('Friendship', friendshipSchema);
