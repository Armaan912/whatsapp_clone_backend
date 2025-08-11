import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getConversations, getOrCreateConversation } from "../controllers/conversationController.js";

const router = express.Router();

router.get("/", authMiddleware, getConversations);
router.post("/", authMiddleware, getOrCreateConversation);

export default router;
