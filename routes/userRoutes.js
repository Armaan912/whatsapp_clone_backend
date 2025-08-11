import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getAllUsers, updateProfile, getUserById, updateProfilePhoto, deleteProfilePhoto, getProfilePhoto } from "../controllers/userController.js";
import { uploadProfilePhoto, handleUploadError } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllUsers);
router.get("/:userId", authMiddleware, getUserById);
router.put("/profile", authMiddleware, updateProfile);
router.post("/profile-photo", authMiddleware, uploadProfilePhoto, handleUploadError, updateProfilePhoto);
router.delete("/profile-photo", authMiddleware, deleteProfilePhoto);
router.get("/profile-photo/:filename", getProfilePhoto);

export default router;
