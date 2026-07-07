import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createGroup, updateGroup } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.put("/:id", protectRoute, updateGroup);

export default router;
