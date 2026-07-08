import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsers, updateProfile, togglePinChat, toggleMuteChat, toggleArchiveChat } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsers);
router.put("/profile", protectRoute, updateProfile);
router.post("/pin/:id", protectRoute, togglePinChat);
router.post("/mute/:id", protectRoute, toggleMuteChat);
router.post("/archive/:id", protectRoute, toggleArchiveChat);

export default router;
