import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createGroup, updateGroup, leaveGroup, deleteGroup } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.put("/:id", protectRoute, updateGroup);
router.post("/:id/leave", protectRoute, leaveGroup);
router.delete("/:id", protectRoute, deleteGroup);

export default router;
