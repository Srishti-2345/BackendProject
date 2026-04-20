import express from "express";

import {
  confirmEnrollment,
  createCheckout,
  getMyEnrollments,
  markLessonComplete,
} from "../controllers/enrollmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", protect, authorize("student"), createCheckout);
router.post("/confirm", protect, authorize("student"), confirmEnrollment);
router.get("/me", protect, authorize("student"), getMyEnrollments);
router.patch("/:enrollmentId/progress", protect, authorize("student"), markLessonComplete);

export default router;

