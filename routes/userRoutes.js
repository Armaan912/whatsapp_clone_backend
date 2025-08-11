import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getAllUsers, updateProfile, getUserById, updateProfilePhoto, deleteProfilePhoto, getProfilePhoto } from "../controllers/userController.js";
import { uploadProfilePhoto, handleUploadError } from "../middlewares/uploadMiddleware.js";

const router = express.Router();



// GET all users except current logged-in user
router.get("/", authMiddleware, getAllUsers);

// GET specific user by ID
router.get("/:userId", authMiddleware, getUserById);

// PUT update user profile
router.put("/profile", authMiddleware, updateProfile);

// POST upload profile photo
router.post("/profile-photo", authMiddleware, uploadProfilePhoto, handleUploadError, updateProfilePhoto);

// DELETE profile photo (reset to default)
router.delete("/profile-photo", authMiddleware, deleteProfilePhoto);

// GET profile photo by filename
router.get("/profile-photo/:filename", getProfilePhoto);



export default router;
