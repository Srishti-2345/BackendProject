import express from "express";

import {
  applyForCreator,
  applyForOpenLearnContributor,
  approveCreatorApplication,
  getCreatorDashboard,
  getCreatorReadiness,
  getReviewItem,
  getReviewerQueue,
  submitReviewDecision,
} from "../controllers/creatorController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { resumeUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/readiness", protect, authorize("student", "instructor"), getCreatorReadiness);
router.get("/dashboard", protect, authorize("student", "instructor"), getCreatorDashboard);
router.get("/reviews/queue", protect, authorize("reviewer"), getReviewerQueue);
router.get("/reviews/:contentType/:contentId", protect, authorize("reviewer"), getReviewItem);
router.patch(
  "/reviews/:contentType/:contentId",
  protect,
  authorize("reviewer"),
  submitReviewDecision
);
router.post("/applications", protect, authorize("student", "instructor"), applyForCreator);
router.post(
  "/openlearn/applications",
  protect,
  authorize("student", "instructor"),
  resumeUpload.single("resume"),
  applyForOpenLearnContributor
);
router.patch(
  "/applications/:applicationId/approve",
  protect,
  authorize("instructor"),
  approveCreatorApplication
);

export default router;
