import express from 'express';
import PayloadProcessor from '../services/PayloadProcessor.js';
import WebhookPayload from '../models/WebhookPayload.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to protected routes
// For development, we'll keep some routes open

// Load payload files to database
router.post('/load-payloads', async (req, res) => {
  try {
    const processor = new PayloadProcessor();
    const results = await processor.loadPayloadsToDatabase();

    res.json({
      success: true,
      message: 'Payloads loaded successfully',
      data: results
    });
  } catch (error) {
    console.error('Load payloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading payloads',
      error: error.message
    });
  }
});

// Process webhook payloads to messages and users
router.post('/process-payloads', async (req, res) => {
  try {
    const processor = new PayloadProcessor();
    const results = await processor.processWebhookPayloads();

    res.json({
      success: true,
      message: 'Payloads processed successfully',
      data: results
    });
  } catch (error) {
    console.error('Process payloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payloads',
      error: error.message
    });
  }
});

// Get all webhook payloads
router.get('/payloads', async (req, res) => {
  try {
    const processor = new PayloadProcessor();
    const payloads = await processor.getAllPayloads();

    res.json({
      success: true,
      data: payloads,
      count: payloads.length
    });
  } catch (error) {
    console.error('Get payloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payloads',
      error: error.message
    });
  }
});

// Get processed messages from payloads
router.get('/processed-messages', async (req, res) => {
  try {
    const processor = new PayloadProcessor();
    const messages = await processor.getProcessedMessages();

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get processed messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching processed messages',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const [payloadCount, processedCount, userCount, messageCount] = await Promise.all([
      WebhookPayload.countDocuments(),
      WebhookPayload.countDocuments({ processed: true }),
      User.countDocuments(),
      Message.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalPayloads: payloadCount,
        processedPayloads: processedCount,
        unprocessedPayloads: payloadCount - processedCount,
        totalUsers: userCount,
        totalMessages: messageCount
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Manual payload processing endpoint
router.post('/process-single', async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Payload data is required'
      });
    }

    const processor = new PayloadProcessor();

    // Save to WebhookPayload collection
    const savedPayload = await WebhookPayload.create(payload);

    // Process the payload
    const result = await processor.processSinglePayload(savedPayload);

    // Mark as processed
    await WebhookPayload.findByIdAndUpdate(savedPayload._id, {
      processed: true,
      processedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Payload processed successfully',
      data: {
        payloadId: savedPayload._id,
        ...result
      }
    });
  } catch (error) {
    console.error('Process single payload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payload',
      error: error.message
    });
  }
});

export default router;
