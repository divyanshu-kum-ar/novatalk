import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsers, updateProfile, togglePinChat } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsers);
router.put("/profile", protectRoute, updateProfile);
router.post("/pin/:id", protectRoute, togglePinChat);

export default router;
