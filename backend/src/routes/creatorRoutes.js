import express from "express";

import {
  applyForCreator,
  approveCreatorApplication,
  getCreatorDashboard,
  getCreatorReadiness,
} from "../controllers/creatorController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/readiness", protect, authorize("student", "instructor"), getCreatorReadiness);
router.get("/dashboard", protect, authorize("student", "instructor"), getCreatorDashboard);
router.post("/applications", protect, authorize("student", "instructor"), applyForCreator);
router.patch(
  "/applications/:applicationId/approve",
  protect,
  authorize("instructor"),
  approveCreatorApplication
);

export default router;
