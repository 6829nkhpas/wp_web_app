import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  participants: [{
    type: String,
    required: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    userId: String,
    archivedAt: Date
  }],
  isMuted: {
    type: Boolean,
    default: false
  },
  mutedBy: [{
    userId: String,
    mutedAt: Date,
    mutedUntil: Date // null for indefinite mute
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: [{
    userId: String,
    blockedAt: Date
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ conversationId: 1, participants: 1 });
conversationSchema.index({ lastActivity: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
