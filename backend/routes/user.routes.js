import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsers, updateProfile, togglePinChat, toggleMuteChat, toggleArchiveChat, getUserProfile, deleteProfile, blockUser, unblockUser, getBlockedUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsers);
router.get("/blocked", protectRoute, getBlockedUsers);
router.get("/:id", protectRoute, getUserProfile);
router.put("/profile", protectRoute, updateProfile);
router.delete("/profile", protectRoute, deleteProfile);
router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.post("/pin/:id", protectRoute, togglePinChat);
router.post("/mute/:id", protectRoute, toggleMuteChat);
router.post("/archive/:id", protectRoute, toggleArchiveChat);

export default router;
