import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Helper to generate token
const generateToken = (userId) => {
  // Set 7 day expiry for security
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    console.log('📝 Signup request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    })
    
    const { username, mobile, password } = req.body;

    if (!username || !mobile || !password) {
      console.log('❌ Missing required fields:', { username: !!username, mobile: !!mobile, password: !!password })
      return res.status(400).json({ message: "username, mobile and password are required" });
    }

    if (password.length < 6) {
      console.log('❌ Password too short:', password.length)
      return res.status(400).json({ message: "Password should be at least 6 characters" });
    }

    console.log('✅ Required fields present, checking for existing user...')
    const normalizedMobile = mobile.replace(/\s+/g, "");
    const existing = await User.findOne({ mobile: normalizedMobile });
    if (existing) {
      console.log('❌ Mobile number already registered:', normalizedMobile)
      return res.status(409).json({ message: "Mobile number already registered" });
    }

    console.log('✅ No existing user found, creating new user...')
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

    console.log('✅ User registered successfully:', userSafe.id)
    return res.status(201).json({
      message: "User registered successfully",
      user: userSafe
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login user and get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    console.log('🔐 Login request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    })
    
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      console.log('❌ Missing required fields:', { mobile: !!mobile, password: !!password })
      return res.status(400).json({ message: "mobile and password required" });
    }

    console.log('✅ Required fields present, proceeding with authentication...')
    const normalizedMobile = mobile.replace(/\s+/g, "");
    const user = await User.findOne({ mobile: normalizedMobile });
    if (!user) {
      console.log('❌ User not found for mobile:', normalizedMobile)
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ User found, checking password...')
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user._id)
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ Password verified, updating user status...')
    // Update user's online status and last seen
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

    console.log('✅ Login successful for user:', userSafe.id)
    return res.json({ user: userSafe, token });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
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
    console.error("Me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    console.log("🚪 === LOGOUT FUNCTION CALLED ===");
    console.log("📝 Request body:", req.body);
    console.log("🔐 Request user:", req.user);
    console.log("🆔 User ID from req.user.id:", req.user?.id);
    
    const userId = req.user.id;
    
    if (!userId) {
      console.error("❌ No user ID found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    console.log(`🚪 User ${userId} attempting to logout`);

    // Verify User model is available
    console.log("📦 User model:", typeof User);
    console.log("📦 User model name:", User?.modelName);

    // Check current user status in database
    console.log("🔍 Finding current user in database...");
    const currentUser = await User.findById(userId);
    console.log("📊 Current user status in DB:", {
      id: currentUser?._id,
      isOnline: currentUser?.isOnline,
      lastSeen: currentUser?.lastSeen
    });

    if (!currentUser) {
      console.error("❌ Current user not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's online status and last seen
    console.log("🔄 Updating user status in database...");
    const updateData = { 
      isOnline: false,
      lastSeen: new Date()
    };
    console.log("📝 Update data:", updateData);
    
    // Try findByIdAndUpdate first
    let updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    // If that fails, try updateOne as fallback
    if (!updatedUser) {
      console.log("⚠️ findByIdAndUpdate failed, trying updateOne...");
      const updateResult = await User.updateOne(
        { _id: userId },
        updateData
      );
      console.log("📊 UpdateOne result:", updateResult);
      
      if (updateResult.modifiedCount > 0) {
        updatedUser = await User.findById(userId);
        console.log("✅ User updated via updateOne:", updatedUser);
      }
    }

    console.log("📊 Updated user result:", {
      id: updatedUser?._id,
      isOnline: updatedUser?.isOnline,
      lastSeen: updatedUser?.lastSeen
    });

    if (!updatedUser) {
      console.error("❌ User not found after update");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ User ${userId} status updated in database: isOnline=${updatedUser.isOnline}`);

    // Verify the update actually happened
    console.log("🔍 Verifying update in database...");
    const verifyUser = await User.findById(userId);
    console.log("🔍 Verification - User status after update:", {
      id: verifyUser?._id,
      isOnline: verifyUser?.isOnline,
      lastSeen: verifyUser?.lastSeen
    });

    // Emit status change to all connected clients
    if (req.io) {
      console.log(`📡 Emitting user_status_change event for user ${userId}`);
      req.io.emit("user_status_change", {
        userId: updatedUser._id,
        isOnline: updatedUser.isOnline,
        lastSeen: updatedUser.lastSeen
      });
      
      // Force disconnect all sessions for this user
      if (req.getUserSocket && req.getUserSocket(userId)) {
        const socketId = req.getUserSocket(userId);
        const socket = req.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          console.log(`🔌 Force disconnected socket ${socketId} for user ${userId}`);
        }
      } else {
        console.log(`ℹ️ No active socket found for user ${userId}`);
      }
      
      // Also emit logout event to ensure socket cleanup
      req.io.emit("force_user_logout", { userId: updatedUser._id });
    } else {
      console.log(`⚠️ req.io not available for user ${userId}`);
    }

    console.log(`🎉 User ${userId} successfully logged out`);

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
    console.error("❌ Logout error:", err);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error name:", err.name);
    console.error("❌ Error message:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Test database connectivity
// @route   GET /api/auth/test-db
// @access  Public
export const testDatabase = async (req, res) => {
  try {
    console.log("🧪 Testing database connectivity...");
    
    // Test basic database connection
    const dbState = mongoose.connection.readyState;
    console.log("📊 Database connection state:", dbState);
    
    // Test User model
    console.log("📦 User model type:", typeof User);
    console.log("📦 User model name:", User?.modelName);
    
    // Test basic find operation
    const userCount = await User.countDocuments();
    console.log("👥 Total users in database:", userCount);
    
    // Test basic insert operation
    const testUser = await User.create({
      username: "test_user_" + Date.now(),
      mobile: "1234567890",
      password: "test123"
    });
    console.log("✅ Test user created:", testUser._id);
    
    // Test basic update operation
    const updatedTestUser = await User.findByIdAndUpdate(
      testUser._id,
      { isOnline: true },
      { new: true }
    );
    console.log("✅ Test user updated:", updatedTestUser.isOnline);
    
    // Test basic delete operation
    await User.findByIdAndDelete(testUser._id);
    console.log("✅ Test user deleted");
    
    return res.json({
      message: "Database test successful",
      dbState,
      userCount,
      userModel: {
        type: typeof User,
        name: User?.modelName
      }
    });
    
  } catch (err) {
    console.error("❌ Database test error:", err);
    return res.status(500).json({ 
      message: "Database test failed",
      error: err.message,
      stack: err.stack
    });
  }
};
