import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    const conversations = await Conversation.find({
      participants: { $in: [currentUserId] }
    }).populate('participants', 'username mobile bio isOnline')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    const transformedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== currentUserId);
      const lastMessage = conv.lastMessage;
      
      return {
        _id: conv._id,
        username: otherParticipant?.username || 'Unknown User',
        mobile: otherParticipant?.mobile || '',
        bio: otherParticipant?.bio || '',
        isOnline: otherParticipant?.isOnline || false,
        lastMessage: lastMessage?.text || '',
        lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
        updatedAt: conv.updatedAt,
        participants: conv.participants.map(p => p._id)
      };
    });
    
    res.json({ conversations: transformedConversations });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({ message: "Invalid current user ID format" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (currentUserId === userId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { 
        $all: [currentUserId, userId],
        $size: 2
      }
    });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          participants: [currentUserId, userId]
        });
      } catch (createError) {
        return res.status(500).json({ message: "Failed to create conversation", details: createError.message });
      }
    }

    if (!conversation || !conversation._id) {
      return res.status(500).json({ message: "Failed to create or find conversation" });
    }

    try {
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username mobile bio isOnline');
      
      if (!populatedConversation) {
        return res.json(conversation);
      }
      
      return res.json(populatedConversation);
    } catch (populateError) {
      return res.json(conversation);
    }
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", details: err.message });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate conversation" });
    }
    
    return res.status(500).json({ message: "Server error", details: err.message });
  }
};
