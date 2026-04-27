import express from "express";

import {
  createThread,
  getThreads,
  replyToThread,
} from "../controllers/discussionController.js";
import { authorize, optionalAuth, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getThreads);
router.post("/", protect, authorize("student", "instructor"), createThread);
router.post("/:threadId/replies", protect, authorize("student", "instructor"), replyToThread);

export default router;
