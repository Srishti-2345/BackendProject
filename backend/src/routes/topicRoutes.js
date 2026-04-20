import express from "express";

import { getLearnerDashboard, getTopicOverview, getTopics } from "../controllers/topicController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTopics);
router.get("/dashboard/me", protect, getLearnerDashboard);
router.get("/:slug", optionalAuth, getTopicOverview);

export default router;

