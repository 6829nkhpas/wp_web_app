import { validationResult } from 'express-validator';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import BlockedUser from '../models/BlockedUser.js';
import { getIO } from '../websocket/socket.js';

// Generate conversation ID between two users
const generateConversationId = (phone1, phone2) => {
  const sorted = [phone1, phone2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

// Check if user is blocked
const isUserBlocked = async (blockedBy, blockedUser) => {
  const blocked = await BlockedUser.findOne({ blockedBy, blockedUser });
  return !!blocked;
};

// Get or create conversation
const getOrCreateConversation = async (conversationId, participants, createdBy) => {
  let conversation = await Conversation.findOne({ conversationId });

  if (!conversation) {
    conversation = await Conversation.create({
      conversationId,
      participants,
      createdBy,
      lastActivity: new Date()
    });
  } else {
    // Update last activity
    conversation.lastActivity = new Date();
    await conversation.save();
  }

  return conversation;
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { fromNumber: currentUser.wa_id },
            { toNumber: currentUser.wa_id }
          ]
        }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$content.body' },
          lastMessageTime: { $last: '$timestamp' },
          lastMessageType: { $last: '$messageType' },
          lastMessageStatus: { $last: '$status' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$fromNumber', currentUser.wa_id] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          // Get the other participant's wa_id
          otherParticipant: {
            $last: {
              $cond: [
                { $eq: ['$fromNumber', currentUser.wa_id] },
                '$toNumber',
                '$fromNumber'
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findOne({ wa_id: conv.otherParticipant })
          .select('name wa_id profileImage lastSeen isOnline');

        return {
          conversationId: conv._id,
          user: otherUser,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          lastMessageType: conv.lastMessageType,
          lastMessageStatus: conv.lastMessageStatus,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: populatedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get archived conversations for a user
export const getArchivedConversations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get archived conversations for current user
    // First, try to find conversations that have been archived by this user
    let archivedConversations = await Conversation.find({
      participants: currentUser.wa_id,
      $or: [
        {
          isArchived: true,
          archivedBy: { $elemMatch: { userId: currentUser.wa_id } }
        },
        {
          // Fallback for any conversation marked as archived
          isArchived: true
        }
      ]
    }).sort({ lastActivity: -1 });

    if (archivedConversations.length === 0) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    // Get conversation details with messages
    const conversationDetails = await Promise.all(
      archivedConversations.map(async (conv) => {
        // Get the other participant
        const otherParticipantId = conv.participants.find(p => p !== currentUser.wa_id);
        const otherUser = await User.findOne({ wa_id: otherParticipantId })
          .select('name wa_id profileImage lastSeen isOnline about');

        // Get last message
        const lastMessage = await Message.findOne({
          conversationId: conv.conversationId,
          // Filter out messages deleted by current user
          $and: [
            {
              $or: [
                { deletedBy: { $not: { $elemMatch: { userId: currentUser.wa_id } } } },
                { deletedBy: { $exists: false } },
                { deletedBy: { $size: 0 } }
              ]
            }
          ]
        }).sort({ timestamp: -1 }).select('content timestamp messageType status');

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          conversationId: conv.conversationId,
          toNumber: currentUser.wa_id,
          status: { $in: ['sent', 'delivered'] },
          // Filter out messages deleted by current user
          $and: [
            {
              $or: [
                { deletedBy: { $not: { $elemMatch: { userId: currentUser.wa_id } } } },
                { deletedBy: { $exists: false } },
                { deletedBy: { $size: 0 } }
              ]
            }
          ]
        });

        // Get archived timestamp for current user
        const archivedEntry = conv.archivedBy.find(entry => entry.userId === currentUser.wa_id);
        const mutedEntry = conv.mutedBy.find(entry => entry.userId === currentUser.wa_id);

        return {
          conversationId: conv.conversationId,
          user: otherUser,
          lastMessage: lastMessage?.content?.body || '',
          lastMessageTime: lastMessage?.timestamp || conv.lastActivity,
          lastMessageType: lastMessage?.messageType || 'text',
          lastMessageStatus: lastMessage?.status || 'sent',
          unreadCount: unreadCount || 0,
          isArchived: true,
          archivedAt: archivedEntry?.archivedAt,
          isMuted: mutedEntry ? true : false
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationDetails.filter(conv => conv.user) // Filter out conversations with deleted users
    });

  } catch (error) {
    console.error('Get archived conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching archived conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify user has access to this conversation
    const hasAccess = await Message.findOne({
      conversationId,
      $or: [
        { fromNumber: currentUser.wa_id },
        { toNumber: currentUser.wa_id }
      ]
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Filter out messages deleted by current user
    const filteredMessages = messages.filter(msg => {
      // If deleted for everyone, show deleted message
      if (msg.deletedForEveryone) {
        return true;
      }

      // If deleted by current user, hide it
      if (msg.deletedBy && msg.deletedBy.some(d => d.userId === currentUser.wa_id)) {
        return false;
      }

      return true;
    });

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        toNumber: currentUser.wa_id,
        status: { $in: ['sent', 'delivered'] }
      },
      { status: 'read' }
    );

    res.json({
      success: true,
      messages: filteredMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { toNumber, message, messageType = 'text', replyTo } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure recipient exists
    const recipient = await User.findOne({ wa_id: toNumber });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Check if either user has blocked the other
    const isBlocked = await isUserBlocked(currentUser.wa_id, toNumber) ||
      await isUserBlocked(toNumber, currentUser.wa_id);

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message. User is blocked.'
      });
    }

    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = generateConversationId(currentUser.wa_id, toNumber);

    // Create message document
    const messageDoc = {
      messageId,
      wa_id: currentUser.wa_id,
      fromNumber: currentUser.wa_id,
      toNumber,
      senderName: currentUser.name,
      messageType,
      content: {
        body: message
      },
      timestamp: new Date(),
      status: 'sent',
      isFromAPI: false,
      conversationId,
      replyTo: replyTo || null
    };

    const savedMessage = await Message.create(messageDoc);

    // Emit message via WebSocket
    const io = getIO();
    if (io) {
      io.to(conversationId).emit('new_message', {
        message: savedMessage,
        conversationId
      });

      // Emit to recipient's personal room for notifications
      io.to(`user_${toNumber}`).emit('message_notification', {
        from: currentUser.name,
        message: message,
        conversationId,
        timestamp: savedMessage.timestamp
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: savedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update message status
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const updateData = {
      status,
      [`statusTimestamps.${status}`]: new Date()
    };

    // Set specific timestamp fields
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'read') {
      updateData.readAt = new Date();
      // Also set delivered if not already set
      if (!message.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    const updatedMessage = await Message.findOneAndUpdate(
      { messageId },
      updateData,
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Emit status update via WebSocket
    const io = getIO();
    if (io) {
      io.to(message.conversationId).emit('message_status_update', {
        messageId,
        status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully',
      data: message
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating message status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has permission to delete
    const canDelete = message.fromNumber === currentUser.wa_id ||
      message.toNumber === currentUser.wa_id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (deleteForEveryone) {
      // Only sender can delete for everyone
      if (message.fromNumber !== currentUser.wa_id) {
        return res.status(403).json({
          success: false,
          message: 'Only sender can delete message for everyone'
        });
      }

      // Check if message is within 7 minutes (WhatsApp rule)
      const messageTime = new Date(message.timestamp);
      const now = new Date();
      const diffInMinutes = (now - messageTime) / (1000 * 60);

      if (diffInMinutes > 7) {
        return res.status(400).json({
          success: false,
          message: 'Message can only be deleted for everyone within 7 minutes'
        });
      }

      // Mark as deleted for everyone
      message.messageType = 'deleted';
      message.content = { body: 'This message was deleted' };
      message.deletedForEveryone = true;
      message.deletedForEveryoneAt = new Date();
      await message.save();

      // Emit to all participants
      const io = getIO();
      if (io) {
        io.to(message.conversationId).emit('message_deleted_for_everyone', {
          messageId,
          conversationId: message.conversationId
        });
      }
    } else {
      // Delete for current user only
      if (!message.deletedBy) {
        message.deletedBy = [];
      }

      // Check if already deleted by this user
      const alreadyDeleted = message.deletedBy.some(d => d.userId === currentUser.wa_id);
      if (!alreadyDeleted) {
        message.deletedBy.push({
          userId: currentUser.wa_id,
          deletedAt: new Date()
        });
        await message.save();
      }
    }

    res.json({
      success: true,
      message: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted for you'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const searchFilter = {
      $and: [
        {
          $or: [
            { fromNumber: currentUser.wa_id },
            { toNumber: currentUser.wa_id }
          ]
        },
        {
          'content.body': { $regex: query, $options: 'i' }
        }
      ]
    };

    if (conversationId) {
      searchFilter.$and.push({ conversationId });
    }

    const messages = await Message.find(searchFilter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Message.countDocuments(searchFilter);

    res.json({
      success: true,
      messages,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete entire conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has access to this conversation
    const hasAccess = await Message.findOne({
      conversationId,
      $or: [
        { fromNumber: currentUser.wa_id },
        { toNumber: currentUser.wa_id }
      ]
    });

    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete conversation record
    await Conversation.deleteOne({ conversationId });

    // Emit conversation deleted event
    const io = getIO();
    if (io) {
      io.to(conversationId).emit('conversation_deleted', {
        conversationId
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Clear all messages in a conversation
export const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has access to this conversation
    const hasAccess = await Message.findOne({
      conversationId,
      $or: [
        { fromNumber: currentUser.wa_id },
        { toNumber: currentUser.wa_id }
      ]
    });

    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Emit conversation cleared event
    const io = getIO();
    if (io) {
      io.to(conversationId).emit('conversation_cleared', {
        conversationId
      });
    }

    res.json({
      success: true,
      message: 'Conversation cleared successfully'
    });

  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Archive/Unarchive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { archive = true } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create conversation
    const participants = conversationId.split('_');
    const conversation = await getOrCreateConversation(
      conversationId,
      participants,
      currentUser.wa_id
    );

    if (archive) {
      // Add user to archived list
      const alreadyArchived = conversation.archivedBy?.some(a => a.userId === currentUser.wa_id);
      if (!alreadyArchived) {
        if (!conversation.archivedBy) conversation.archivedBy = [];
        conversation.archivedBy.push({
          userId: currentUser.wa_id,
          archivedAt: new Date()
        });
      }
    } else {
      // Remove user from archived list
      if (conversation.archivedBy) {
        conversation.archivedBy = conversation.archivedBy.filter(a => a.userId !== currentUser.wa_id);
      }
    }

    conversation.isArchived = conversation.archivedBy?.length > 0;
    await conversation.save();

    res.json({
      success: true,
      message: archive ? 'Conversation archived successfully' : 'Conversation unarchived successfully'
    });

  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mute/Unmute conversation
export const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { mute = true, duration = null } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create conversation
    const participants = conversationId.split('_');
    const conversation = await getOrCreateConversation(
      conversationId,
      participants,
      currentUser.wa_id
    );

    if (mute) {
      // Add user to muted list
      const alreadyMuted = conversation.mutedBy?.some(m => m.userId === currentUser.wa_id);
      if (!alreadyMuted) {
        if (!conversation.mutedBy) conversation.mutedBy = [];

        const muteData = {
          userId: currentUser.wa_id,
          mutedAt: new Date()
        };

        if (duration) {
          muteData.mutedUntil = new Date(Date.now() + duration);
        }

        conversation.mutedBy.push(muteData);
      }
    } else {
      // Remove user from muted list
      if (conversation.mutedBy) {
        conversation.mutedBy = conversation.mutedBy.filter(m => m.userId !== currentUser.wa_id);
      }
    }

    conversation.isMuted = conversation.mutedBy?.length > 0;
    await conversation.save();

    res.json({
      success: true,
      message: mute ? 'Conversation muted successfully' : 'Conversation unmuted successfully'
    });

  } catch (error) {
    console.error('Mute conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while muting conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Block user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if target user exists
    const targetUser = await User.findOne({ wa_id: userId });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to block not found'
      });
    }

    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      blockedBy: currentUser.wa_id,
      blockedUser: userId
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Create block record
    await BlockedUser.create({
      blockedBy: currentUser.wa_id,
      blockedUser: userId
    });

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while blocking user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove block record
    const result = await BlockedUser.deleteOne({
      blockedBy: currentUser.wa_id,
      blockedUser: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unblocking user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const blockedUsers = await BlockedUser.find({ blockedBy: currentUser.wa_id })
      .populate('blockedUser', 'name wa_id profileImage')
      .sort({ blockedAt: -1 });

    res.json({
      success: true,
      blockedUsers: blockedUsers.map(block => ({
        userId: block.blockedUser,
        blockedAt: block.blockedAt,
        reason: block.reason
      }))
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blocked users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export conversation
export const exportConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all messages in the conversation
    const messages = await Message.find({
      conversationId,
      $or: [
        { fromNumber: currentUser.wa_id },
        { toNumber: currentUser.wa_id }
      ]
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No messages found in this conversation'
      });
    }

    // Format messages for export
    const exportData = messages.map(msg => {
      const date = new Date(msg.timestamp).toLocaleString();
      const sender = msg.fromNumber === currentUser.wa_id ? 'You' : msg.senderName;
      const content = msg.messageType === 'deleted' ? 'This message was deleted' : msg.content.body;
      return `[${date}] ${sender}: ${content}`;
    }).join('\n');

    const exportText = `WhatsApp Chat Export\nConversation: ${conversationId}\nExported on: ${new Date().toLocaleString()}\n\n${exportData}`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-chat-${conversationId}.txt"`);
    res.send(exportText);

  } catch (error) {
    console.error('Export conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, toNumbers } = req.body;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get original message
    const originalMessage = await Message.findOne({ messageId });
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to the message
    const hasAccess = originalMessage.fromNumber === currentUser.wa_id ||
      originalMessage.toNumber === currentUser.wa_id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const forwardedMessages = [];

    // Forward to each recipient
    for (const toNumber of toNumbers) {
      const recipient = await User.findOne({ wa_id: toNumber });
      if (!recipient) continue;

      // Check if recipient is blocked
      const isBlocked = await isUserBlocked(currentUser.wa_id, toNumber) ||
        await isUserBlocked(toNumber, currentUser.wa_id);

      if (isBlocked) continue;

      const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newConversationId = generateConversationId(currentUser.wa_id, toNumber);

      const forwardedMessage = await Message.create({
        messageId: newMessageId,
        wa_id: currentUser.wa_id,
        fromNumber: currentUser.wa_id,
        toNumber,
        senderName: currentUser.name,
        messageType: originalMessage.messageType,
        content: originalMessage.content,
        timestamp: new Date(),
        status: 'sent',
        conversationId: newConversationId,
        isFromAPI: false
      });

      forwardedMessages.push(forwardedMessage);

      // Emit via WebSocket
      const io = getIO();
      if (io) {
        io.to(newConversationId).emit('new_message', {
          message: forwardedMessage,
          conversationId: newConversationId
        });

        io.to(`user_${toNumber}`).emit('message_notification', {
          from: currentUser.name,
          message: forwardedMessage.content.body,
          conversationId: newConversationId,
          timestamp: forwardedMessage.timestamp
        });
      }
    }

    res.json({
      success: true,
      message: `Message forwarded to ${forwardedMessages.length} recipients`,
      forwardedTo: forwardedMessages.length
    });

  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while forwarding message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get message info
export const getMessageInfo = async (req, res) => {
  try {
    const { messageId } = req.params;

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to the message
    const hasAccess = message.fromNumber === currentUser.wa_id ||
      message.toNumber === currentUser.wa_id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      info: {
        messageId: message.messageId,
        messageType: message.messageType,
        content: message.content,
        timestamp: message.timestamp,
        status: message.status,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        fromNumber: message.fromNumber,
        toNumber: message.toNumber,
        senderName: message.senderName,
        conversationId: message.conversationId
      }
    });

  } catch (error) {
    console.error('Get message info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
