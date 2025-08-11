import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const signup = async (req, res) => {
  try {
    const { username, mobile, password } = req.body;

    if (!username || !mobile || !password) {
      return res.status(400).json({ message: "username, mobile and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters" });
    }

    const normalizedMobile = mobile.replace(/\s+/g, "");
    const existing = await User.findOne({ mobile: normalizedMobile });
    if (existing) {
      return res.status(409).json({ message: "Mobile number already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      mobile: normalizedMobile,
      password: hashed
    });

    const userSafe = {
      id: user._id,
      username: user.username,
      mobile: user.mobile,
      profilePic: user.profilePic,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };

    return res.status(201).json({
      message: "User registered successfully",
      user: userSafe
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: "mobile and password required" });
    }

    const normalizedMobile = mobile.replace(/\s+/g, "");
    const user = await User.findOne({ mobile: normalizedMobile });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        isOnline: true,
        lastSeen: new Date()
      },
      { new: true }
    );

    const token = generateToken(updatedUser._id);

    const userSafe = {
      id: updatedUser._id,
      username: updatedUser.username,
      mobile: updatedUser.mobile,
      profilePic: updatedUser.profilePic,
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen
    };

    return res.json({ user: userSafe, token });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userSafe = {
      id: user._id,
      username: user.username,
      mobile: user.mobile,
      profilePic: user.profilePic,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.json({
      user: userSafe
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = { 
      isOnline: false,
      lastSeen: new Date()
    };
    
    let updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      const updateResult = await User.updateOne(
        { _id: userId },
        updateData
      );
      
      if (updateResult.modifiedCount > 0) {
        updatedUser = await User.findById(userId);
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.io) {
      req.io.emit("user_status_change", {
        userId: updatedUser._id,
        isOnline: updatedUser.isOnline,
        lastSeen: updatedUser.lastSeen
      });
      
      if (req.getUserSocket && req.getUserSocket(userId)) {
        const socketId = req.getUserSocket(userId);
        const socket = req.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
      
      req.io.emit("force_user_logout", { userId: updatedUser._id });
    }

    return res.json({ 
      message: "Logged out successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        mobile: updatedUser.mobile,
        profilePic: updatedUser.profilePic,
        isOnline: updatedUser.isOnline,
        lastSeen: updatedUser.lastSeen
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
