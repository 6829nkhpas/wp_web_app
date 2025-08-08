import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

class WebhookParser {
  constructor() {
    this.payloadsDir = path.join(process.cwd(), '..', 'payloads');
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone');
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async parseWebhookPayload(payload) {
    try {
      const { metaData, payload_type } = payload;

      if (payload_type !== 'whatsapp_webhook') {
        console.log('⚠️ Skipping non-WhatsApp webhook payload');
        return;
      }

      for (const entry of metaData.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            await this.processMessages(change.value);
          } else if (change.field === 'message_status') {
            await this.processMessageStatus(change.value);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing webhook payload:', error);
      throw error;
    }
  }

  async processMessages(messageData) {
    const { contacts = [], messages = [], metadata } = messageData;

    // Process contacts first to ensure users exist
    for (const contact of contacts) {
      await this.upsertUser({
        wa_id: contact.wa_id,
        name: contact.profile?.name || 'Unknown',
        phoneNumber: contact.wa_id
      });
    }

    // Process messages
    for (const message of messages) {
      await this.processMessage(message, metadata);
    }
  }

  async processMessage(message, metadata) {
    try {
      const fromNumber = message.from;
      const toNumber = metadata?.display_phone_number || process.env.WHATSAPP_DISPLAY_PHONE_NUMBER;
      const isFromAPI = fromNumber === toNumber;

      // Get sender info
      const senderUser = await User.findOne({ wa_id: fromNumber });
      const senderName = senderUser?.name || 'Unknown';

      // Create conversation ID (consistent between two parties)
      const conversationId = this.generateConversationId(fromNumber, toNumber);

      const messageDoc = {
        messageId: message.id,
        wa_id: isFromAPI ? toNumber : fromNumber, // The other party's wa_id
        fromNumber,
        toNumber,
        senderName,
        messageType: message.type || 'text',
        content: this.extractMessageContent(message),
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        status: 'sent',
        isFromAPI,
        conversationId,
        replyTo: message.context?.id || null
      };

      // Check if message already exists
      const existingMessage = await Message.findOne({ messageId: message.id });
      if (existingMessage) {
        console.log(`⚠️ Message ${message.id} already exists, skipping...`);
        return;
      }

      const savedMessage = await Message.create(messageDoc);
      console.log(`✅ Processed message: ${savedMessage.messageId} from ${senderName}`);

      return savedMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async processMessageStatus(statusData) {
    const { statuses = [] } = statusData;

    for (const status of statuses) {
      try {
        const updateResult = await Message.updateOne(
          { messageId: status.id },
          {
            status: status.status,
            ...(status.timestamp && {
              [`statusTimestamps.${status.status}`]: new Date(parseInt(status.timestamp) * 1000)
            })
          }
        );

        if (updateResult.matchedCount > 0) {
          console.log(`✅ Updated message ${status.id} status to: ${status.status}`);
        } else {
          console.log(`⚠️ Message ${status.id} not found for status update`);
        }
      } catch (error) {
        console.error(`Error updating message status for ${status.id}:`, error);
      }
    }
  }

  async upsertUser(userData) {
    try {
      const user = await User.findOneAndUpdate(
        { wa_id: userData.wa_id },
        {
          $set: {
            ...userData,
            lastSeen: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  extractMessageContent(message) {
    const content = {};

    switch (message.type) {
      case 'text':
        content.body = message.text?.body || '';
        break;
      case 'image':
      case 'document':
      case 'audio':
      case 'video':
        content.mediaUrl = message[message.type]?.link || '';
        content.caption = message[message.type]?.caption || '';
        content.filename = message[message.type]?.filename || '';
        break;
      default:
        content.body = JSON.stringify(message);
    }

    return content;
  }

  generateConversationId(phone1, phone2) {
    // Sort phone numbers to ensure consistent conversation ID
    const sorted = [phone1, phone2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  async processAllPayloads() {
    try {
      const files = await fs.readdir(this.payloadsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`📁 Found ${jsonFiles.length} payload files to process`);

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.payloadsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const payload = JSON.parse(fileContent);

          console.log(`🔄 Processing ${file}...`);
          await this.parseWebhookPayload(payload);
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error.message);
        }
      }

      console.log('✅ All payloads processed successfully!');
    } catch (error) {
      console.error('Error reading payloads directory:', error);
      throw error;
    }
  }
}

// Script execution
async function main() {
  const parser = new WebhookParser();

  try {
    await parser.connectDB();
    await parser.processAllPayloads();

    // Display summary
    const messageCount = await Message.countDocuments();
    const userCount = await User.countDocuments();

    console.log('\n📊 Processing Summary:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💬 Messages: ${messageCount}`);

  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default WebhookParser;
export const parseWebhookPayload = (payload) => {
  const parser = new WebhookParser();
  return parser.parseWebhookPayload(payload);
};
