import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsers, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsers);
router.put("/profile", protectRoute, updateProfile);

export default router;
