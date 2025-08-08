import mongoose from 'mongoose';

// Schema for WhatsApp webhook payload - using Mixed type for flexibility
const webhookPayloadSchema = new mongoose.Schema({
  payload_type: {
    type: String,
    required: true,
    default: 'whatsapp_webhook'
  },
  _id: {
    type: String,
    required: true,
    unique: true
  },
  metaData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: String,
    required: false
  },
  startedAt: {
    type: String,
    required: false
  },
  completedAt: {
    type: String,
    required: false
  },
  executed: {
    type: Boolean,
    default: false
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  strict: false // Allow additional fields not defined in schema
});

// Index for efficient queries
webhookPayloadSchema.index({ 'metaData.entry.changes.value.messages.from': 1 });
webhookPayloadSchema.index({ 'metaData.entry.changes.value.messages.timestamp': 1 });
webhookPayloadSchema.index({ processed: 1 });
webhookPayloadSchema.index({ executed: 1 });
webhookPayloadSchema.index({ payload_type: 1 });

const WebhookPayload = mongoose.model('WebhookPayload', webhookPayloadSchema);

export default WebhookPayload;
