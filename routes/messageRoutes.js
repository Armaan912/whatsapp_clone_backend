import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { sendMessage, getMessages, updateMessageStatus } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:conversationId", authMiddleware, getMessages);
router.put("/:messageId/status", authMiddleware, updateMessageStatus);

export default router;
