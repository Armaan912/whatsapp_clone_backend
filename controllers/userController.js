import User from "../models/user.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password");

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, mobile, bio, profilePic } = req.body;
    const userId = req.user.id;

    if (mobile) {
      const existingUser = await User.findOne({ mobile, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Mobile number already exists" });
      }
    }

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
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "No profile photo file uploaded" });
    }

    const profilePicPath = `/uploads/profile-photos/${req.file.filename}`;
    
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.profilePic && currentUser.profilePic !== '/uploads/profile-photos/default-avatar.png') {
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const oldPhotoPath = path.join(__dirname, '..', currentUser.profilePic);
        
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      } catch (deleteError) {
        // Silent error handling for file deletion
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePicPath },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile photo updated successfully",
      user: updatedUser,
      profilePic: profilePicPath
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.profilePic && currentUser.profilePic !== '/uploads/profile-photos/default-avatar.png') {
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const photoPath = path.join(__dirname, '..', currentUser.profilePic);
        
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      } catch (deleteError) {
        // Silent error handling for file deletion
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: null },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile photo deleted successfully",
      user: updatedUser
    });

  } catch (err) {
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
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const getProfilePhoto = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const photoPath = path.join(__dirname, '..', 'uploads', 'profile-photos', filename);
    
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ message: "Profile photo not found" });
    }

    res.sendFile(photoPath);
    
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
