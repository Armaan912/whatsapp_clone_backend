import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { sendMessage, getMessages, updateMessageStatus } from "../controllers/messageController.js";

const router = express.Router();

// Send a message
router.post("/", authMiddleware, sendMessage);

// Get messages in a conversation
router.get("/:conversationId", authMiddleware, getMessages);

// Update message status (delivered/read)
router.put("/:messageId/status", authMiddleware, updateMessageStatus);

export default router;
