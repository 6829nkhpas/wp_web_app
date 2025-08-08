import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  wa_id: {
    type: String,
    required: true,
    index: true
  },
  fromNumber: {
    type: String,
    required: true
  },
  toNumber: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'audio', 'video', 'deleted'],
    default: 'text'
  },
  content: {
    body: String,
    mediaUrl: String,
    caption: String,
    filename: String,
    size: Number
  },
  timestamp: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  isFromAPI: {
    type: Boolean,
    default: false // true if message is from business API, false if from user
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  replyTo: {
    type: String,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    userId: String,
    deletedAt: Date
  }],
  deletedForEveryone: {
    type: Boolean,
    default: false
  },
  deletedForEveryoneAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, timestamp: 1 });
messageSchema.index({ messageId: 1, status: 1 });
messageSchema.index({ isDeleted: 1, deletedForEveryone: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
