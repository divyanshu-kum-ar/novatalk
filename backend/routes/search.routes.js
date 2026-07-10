import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", protectRoute, globalSearch);

export default router;
