import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema({
  blockedBy: {
    type: String,
    required: true,
    index: true
  },
  blockedUser: {
    type: String,
    required: true,
    index: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    default: 'User blocked'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate blocks
blockedUserSchema.index({ blockedBy: 1, blockedUser: 1 }, { unique: true });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

export default BlockedUser;
