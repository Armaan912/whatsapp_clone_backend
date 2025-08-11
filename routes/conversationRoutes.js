import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getConversations, getOrCreateConversation } from "../controllers/conversationController.js";

const router = express.Router();

// Get all conversations for the authenticated user
router.get("/", authMiddleware, getConversations);

// Create or get conversation
router.post("/", authMiddleware, getOrCreateConversation);

export default router;
