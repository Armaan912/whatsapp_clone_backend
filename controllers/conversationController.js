import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: { $in: [currentUserId] }
    }).populate('participants', 'username mobile bio isOnline')
    .populate('lastMessage')
    .sort({ updatedAt: -1 }); // Sort by most recent
    
    // Transform conversations to include the other participant's info
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
        participants: conv.participants.map(p => p._id) // Include participant IDs
      };
    });
    
    res.json({ conversations: transformedConversations });
  } catch (err) {
    console.error("❌ getConversations error:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

export const getOrCreateConversation = async (req, res) => {
  console.log("🔍 getOrCreateConversation called with:", {
    userId: req.body.userId,
    currentUserId: req.user.id,
    body: req.body,
    headers: req.headers
  });

  try {
    const { userId } = req.body; // the other user's id
    const currentUserId = req.user.id;

    console.log("🔍 Processing request with:", { userId, currentUserId });

    // Validate that userId is provided
    if (!userId) {
      console.log("❌ Missing userId in request body");
      return res.status(400).json({ message: "userId is required" });
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ Invalid userId format:", userId);
      return res.status(400).json({ message: "Invalid userId format" });
    }

    // Validate that currentUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      console.log("❌ Invalid currentUserId format:", currentUserId);
      return res.status(400).json({ message: "Invalid current user ID format" });
    }

    // Check if the target user exists
    console.log("🔍 Checking if target user exists:", userId);
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      console.log("❌ Target user not found:", userId);
      return res.status(404).json({ message: "Target user not found" });
    }
    console.log("✅ Target user found:", targetUser.username);

    // Prevent creating conversation with self
    if (currentUserId === userId) {
      console.log("❌ Cannot create conversation with self");
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    console.log("🔍 Looking for existing conversation between:", [currentUserId, userId]);

    let conversation = await Conversation.findOne({
      participants: { 
        $all: [currentUserId, userId],
        $size: 2
      }
    });

    if (!conversation) {
      console.log("📝 Creating new conversation...");
      try {
        conversation = await Conversation.create({
          participants: [currentUserId, userId]
        });
        console.log("✅ New conversation created:", conversation._id);
      } catch (createError) {
        console.error("❌ Error creating conversation:", createError);
        return res.status(500).json({ message: "Failed to create conversation", details: createError.message });
      }
    } else {
      console.log("✅ Existing conversation found:", conversation._id);
    }

    // Validate that conversation was created/found successfully
    if (!conversation || !conversation._id) {
      console.error("❌ Conversation creation/finding failed");
      return res.status(500).json({ message: "Failed to create or find conversation" });
    }

    // Populate the conversation with participant details
    console.log("🔍 Populating conversation with participant details...");
    try {
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username mobile bio isOnline');
      
      if (!populatedConversation) {
        console.log("⚠️ Conversation not found after population, returning original");
        return res.json(conversation);
      }
      
      console.log("📤 Returning populated conversation:", populatedConversation._id);
      return res.json(populatedConversation);
    } catch (populateError) {
      console.error("❌ Error populating conversation:", populateError);
      console.log("📤 Returning unpopulated conversation due to population error");
      return res.json(conversation);
    }
  } catch (err) {
    console.error("❌ getOrCreateConversation error:", err);
    console.error("📊 Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue
    });
    
    // Handle specific MongoDB errors
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
