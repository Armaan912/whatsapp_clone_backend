import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ["image", "video", "document", "none"], default: "none" },
    status: { type: String, enum: ["pending", "sent", "delivered", "read"], default: "pending" },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
