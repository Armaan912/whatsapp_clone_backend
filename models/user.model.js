import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true }, // WhatsApp-style mobile number
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" }, // User bio/status message
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
