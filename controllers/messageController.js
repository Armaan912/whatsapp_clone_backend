import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, text, mediaUrl, mediaType } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !receiverId || !text) {
      return res.status(400).json({ message: "Missing required fields: conversationId, receiverId, text" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: "Not authorized to send message to this conversation" });
    }

    const messageData = {
      senderId,
      receiverId,
      text: text || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "none",
      conversationId
    };
    
    const message = await Message.create(messageData);

    conversation.lastMessage = message._id;
    await conversation.save();

    req.io.to(receiverId.toString()).emit("receive_message", message);

    if (req.io) {
      req.io.to(conversationId.toString()).emit("receive_message", message);
      req.io.to(senderId.toString()).emit("receive_message", message);
    }

    return res.status(201).json(message);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", errors: err.errors });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!status || !['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'sent', 'delivered', or 'read'" });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.json(message);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
