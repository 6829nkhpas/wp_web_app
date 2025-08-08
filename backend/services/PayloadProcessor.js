import fs from 'fs/promises';
import path from 'path';
import WebhookPayload from '../models/WebhookPayload.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate conversation ID between two users
const generateConversationId = (phone1, phone2) => {
  const sorted = [phone1, phone2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

class PayloadProcessor {
  constructor() {
    this.payloadsDir = path.join(__dirname, '../../payloads');
  }

  // Load and save all payload files to MongoDB
  async loadPayloadsToDatabase() {
    try {
      const files = await fs.readdir(this.payloadsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`📦 Found ${jsonFiles.length} payload files`);

      const results = {
        loaded: 0,
        skipped: 0,
        errors: 0
      };

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.payloadsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const payload = JSON.parse(content);

          // Add default timestamps if not present
          const now = new Date().toISOString();
          if (!payload.startedAt && payload.metaData?.startedAt) {
            payload.startedAt = payload.metaData.startedAt;
          }
          if (!payload.completedAt && payload.metaData?.completedAt) {
            payload.completedAt = payload.metaData.completedAt;
          }
          if (!payload.createdAt) {
            payload.createdAt = now;
          }
          if (!payload.startedAt) {
            payload.startedAt = now;
          }

          // Check if payload already exists
          const existing = await WebhookPayload.findOne({ _id: payload._id });
          if (existing) {
            console.log(`⏭️  Skipping existing payload: ${payload._id}`);
            results.skipped++;
            continue;
          }

          // Save to database
          await WebhookPayload.create(payload);
          console.log(`✅ Loaded payload: ${payload._id}`);
          results.loaded++;

        } catch (error) {
          console.error(`❌ Error processing file ${file}:`, error.message);
          results.errors++;
        }
      }

      console.log(`\n📊 Loading Summary:`);
      console.log(`✅ Loaded: ${results.loaded}`);
      console.log(`⏭️  Skipped: ${results.skipped}`);
      console.log(`❌ Errors: ${results.errors}`);

      return results;
    } catch (error) {
      console.error('❌ Error loading payloads:', error);
      throw error;
    }
  }

  // Process webhook payloads and convert to messages and users
  async processWebhookPayloads() {
    try {
      const unprocessedPayloads = await WebhookPayload.find({ processed: false });
      console.log(`🔄 Processing ${unprocessedPayloads.length} unprocessed payloads`);

      const results = {
        processed: 0,
        users: 0,
        messages: 0,
        errors: 0
      };

      for (const payload of unprocessedPayloads) {
        try {
          const processResult = await this.processSinglePayload(payload);
          results.users += processResult.users;
          results.messages += processResult.messages;
          results.processed++;

          // Mark as processed
          await WebhookPayload.findByIdAndUpdate(payload._id, {
            processed: true,
            processedAt: new Date()
          });

        } catch (error) {
          console.error(`❌ Error processing payload ${payload._id}:`, error.message);
          results.errors++;
        }
      }

      console.log(`\n📊 Processing Summary:`);
      console.log(`🔄 Processed: ${results.processed}`);
      console.log(`👥 Users created/updated: ${results.users}`);
      console.log(`💬 Messages created: ${results.messages}`);
      console.log(`❌ Errors: ${results.errors}`);

      return results;
    } catch (error) {
      console.error('❌ Error processing payloads:', error);
      throw error;
    }
  }

  // Process a single payload
  async processSinglePayload(payload) {
    const results = { users: 0, messages: 0 };

    if (!payload.metaData?.entry) {
      return results;
    }

    for (const entry of payload.metaData.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value) {
          const value = change.value;

          // Process contacts (users)
          if (value.contacts) {
            for (const contact of value.contacts) {
              await this.upsertUser(contact);
              results.users++;
            }
          }

          // Process messages
          if (value.messages) {
            for (const message of value.messages) {
              await this.processMessage(message, value.metadata);
              results.messages++;
            }
          }

          // Process status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.processStatusUpdate(status, value.metadata);
            }
          }
        }
      }
    }

    return results;
  }

  // Create or update user
  async upsertUser(contactData) {
    try {
      const userData = {
        name: contactData.profile?.name || 'Unknown User',
        wa_id: contactData.wa_id,
        phoneNumber: contactData.wa_id,
        isVerified: true,
        lastSeen: new Date()
      };

      await User.findOneAndUpdate(
        { wa_id: contactData.wa_id },
        userData,
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  // Process a single message
  async processMessage(messageData, metadata) {
    try {
      // Get sender info
      const sender = await User.findOne({ wa_id: messageData.from });
      if (!sender) {
        console.warn(`Sender not found: ${messageData.from}`);
        return;
      }

      // Determine recipient (business number from metadata)
      const businessNumber = metadata?.display_phone_number || '918329446654';

      // Generate conversation ID
      const conversationId = generateConversationId(messageData.from, businessNumber);

      // Create message document
      const messageDoc = {
        messageId: messageData.id,
        wa_id: messageData.from,
        fromNumber: messageData.from,
        toNumber: businessNumber,
        senderName: sender.name,
        messageType: messageData.type || 'text',
        content: {
          body: messageData.text?.body || ''
        },
        timestamp: new Date(parseInt(messageData.timestamp) * 1000),
        status: 'delivered',
        isFromAPI: false,
        conversationId
      };

      // Check if message already exists
      const existingMessage = await Message.findOne({ messageId: messageData.id });
      if (existingMessage) {
        console.log(`Message already exists: ${messageData.id}`);
        return;
      }

      await Message.create(messageDoc);
      console.log(`✅ Created message: ${messageData.id}`);

    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  // Process a status update
  async processStatusUpdate(statusData, metadata) {
    try {
      // Update message status if message exists
      const existingMessage = await Message.findOne({ messageId: statusData.id });
      if (existingMessage) {
        await Message.findByIdAndUpdate(existingMessage._id, {
          status: statusData.status,
          lastUpdated: new Date(parseInt(statusData.timestamp) * 1000)
        });
        console.log(`✅ Updated message status: ${statusData.id} -> ${statusData.status}`);
      } else {
        console.log(`⚠️  Message not found for status update: ${statusData.id}`);
      }
    } catch (error) {
      console.error('Error processing status update:', error);
      throw error;
    }
  }

  // Get all webhook payloads
  async getAllPayloads() {
    try {
      return await WebhookPayload.find({}).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching payloads:', error);
      throw error;
    }
  }

  // Get processed messages from payloads
  async getProcessedMessages() {
    try {
      return await Message.find({})
        .populate('wa_id', 'name profileImage')
        .sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching processed messages:', error);
      throw error;
    }
  }
}

export default PayloadProcessor;
