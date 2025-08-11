import User from "../models/user.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 getAllUsers called');
    console.log('👤 Current user ID:', req.user?.id);
    console.log('🔐 User object from middleware:', req.user);
    
    const currentUserId = req.user.id;
    console.log('🎯 Searching for users excluding:', currentUserId);

    // Exclude the logged-in user from the list
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password"); // don't send password hashes

    console.log('✅ Found users:', users.length);
    console.log('👥 Users:', users.map(u => ({ id: u._id, username: u.username, mobile: u.mobile, bio: u.bio, isOnline: u.isOnline })));
    
    // Also check total users in database
    const totalUsers = await User.countDocuments();
    console.log('📊 Total users in database:', totalUsers);
    
    // Check if current user exists
    const currentUser = await User.findById(currentUserId);
    console.log('👤 Current user in database:', currentUser ? { id: currentUser._id, username: currentUser.username } : 'Not found');

    return res.json(users);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    console.error("❌ Error stack:", err.stack);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, mobile, bio, profilePic } = req.body;
    const userId = req.user.id;

    // Check if mobile number is being updated and if it conflicts with other users
    if (mobile) {
      const existingUser = await User.findOne({ mobile, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Mobile number already exists" });
      }
    }

    // Check if username is being updated and if it conflicts with other users
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (mobile) updateData.mobile = mobile;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic) updateData.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user profile photo
// @route   POST /api/users/profile-photo
// @access  Private
export const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No profile photo file uploaded" });
    }

    // Get the file path relative to uploads directory
    const profilePicPath = `/uploads/profile-photos/${req.file.filename}`;
    
    // Get current user to check if they have an existing profile photo
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile photo if it exists
    if (currentUser.profilePic && currentUser.profilePic !== '/uploads/profile-photos/default-avatar.png') {
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const oldPhotoPath = path.join(__dirname, '..', currentUser.profilePic);
        
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log(`🗑️ Deleted old profile photo: ${oldPhotoPath}`);
        }
      } catch (deleteError) {
        console.error("⚠️ Could not delete old profile photo:", deleteError);
        // Don't fail the request if old photo deletion fails
      }
    }
    
    // Update user's profile photo in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePicPath },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Profile photo updated for user ${userId}: ${profilePicPath}`);

    return res.json({
      message: "Profile photo updated successfully",
      user: updatedUser,
      profilePic: profilePicPath
    });

  } catch (err) {
    console.error("❌ updateProfilePhoto error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete user profile photo (reset to default)
// @route   DELETE /api/users/profile-photo
// @access  Private
export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current user to check if they have a profile photo
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete current profile photo if it exists and is not default
    if (currentUser.profilePic && currentUser.profilePic !== '/uploads/profile-photos/default-avatar.png') {
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const photoPath = path.join(__dirname, '..', currentUser.profilePic);
        
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log(`🗑️ Deleted profile photo: ${photoPath}`);
        }
      } catch (deleteError) {
        console.error("⚠️ Could not delete profile photo:", deleteError);
        // Don't fail the request if photo deletion fails
      }
    }
    
    // Reset profile photo to default or null
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: null },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Profile photo deleted for user ${userId}`);

    return res.json({
      message: "Profile photo deleted successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("❌ deleteProfilePhoto error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};





export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      user: {
        id: user._id,
        username: user.username,
        mobile: user.mobile,
        profilePic: user.profilePic,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (err) {
    console.error("❌ getUserById error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// @desc    Get profile photo by filename
// @route   GET /api/users/profile-photo/:filename
// @access  Public
export const getProfilePhoto = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const photoPath = path.join(__dirname, '..', 'uploads', 'profile-photos', filename);
    
    // Check if file exists
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ message: "Profile photo not found" });
    }

    // Send the file
    res.sendFile(photoPath);
    
  } catch (err) {
    console.error("❌ getProfilePhoto error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
