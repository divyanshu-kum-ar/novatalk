import express from "express";
import { getMessages, sendMessage, editMessage, deleteMessage, toggleReaction } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/delete/:id", protectRoute, deleteMessage);
router.post("/react/:id", protectRoute, toggleReaction);

export default router;
