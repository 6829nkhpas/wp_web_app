import express from 'express';
import { body, param } from 'express-validator';
import {
  getConversations,
  getArchivedConversations,
  getMessages,
  sendMessage,
  updateMessageStatus,
  deleteMessage,
  deleteConversation,
  clearConversation,
  archiveConversation,
  muteConversation,
  blockUser,
  unblockUser,
  getBlockedUsers,
  exportConversation,
  forwardMessage,
  getMessageInfo,
  searchMessages
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation middleware
const sendMessageValidation = [
  body('toNumber')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Please provide a valid recipient phone number'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 4096 })
    .withMessage('Message content cannot exceed 4096 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'document', 'audio', 'video'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reply to message ID cannot be empty if provided')
];

const updateStatusValidation = [
  param('messageId')
    .trim()
    .notEmpty()
    .withMessage('Message ID is required'),
  body('status')
    .isIn(['sent', 'delivered', 'read', 'failed'])
    .withMessage('Invalid status value')
];

const messageIdValidation = [
  param('messageId')
    .trim()
    .notEmpty()
    .withMessage('Message ID is required')
];

const conversationIdValidation = [
  param('conversationId')
    .trim()
    .notEmpty()
    .withMessage('Conversation ID is required')
];

const blockUserValidation = [
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
];

const forwardMessageValidation = [
  body('messageId')
    .trim()
    .notEmpty()
    .withMessage('Message ID is required'),
  body('toNumbers')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('toNumbers.*')
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Invalid phone number format')
];

// Basic message routes
router.get('/conversations', getConversations);
router.get('/conversations/archived', getArchivedConversations);
router.get('/conversation/:conversationId', conversationIdValidation, getMessages);
router.post('/send', sendMessageValidation, sendMessage);
router.put('/status/:messageId', updateStatusValidation, updateMessageStatus);
router.delete('/:messageId', messageIdValidation, deleteMessage);
router.get('/search', searchMessages);

// Conversation management routes
router.delete('/conversation/:conversationId', conversationIdValidation, deleteConversation);
router.delete('/conversation/:conversationId/clear', conversationIdValidation, clearConversation);
router.put('/conversation/:conversationId/archive', conversationIdValidation, archiveConversation);
router.put('/conversation/:conversationId/mute', conversationIdValidation, muteConversation);
router.get('/conversation/:conversationId/export', conversationIdValidation, exportConversation);

// User management routes
router.post('/block', blockUserValidation, blockUser);
router.delete('/block', blockUserValidation, unblockUser);
router.get('/blocked', getBlockedUsers);

// Message actions
router.post('/forward', forwardMessageValidation, forwardMessage);
router.get('/info/:messageId', messageIdValidation, getMessageInfo);

export default router;
