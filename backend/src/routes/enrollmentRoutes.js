import express from "express";

import {
  confirmEnrollment,
  createCheckout,
  getEnrollmentCourse,
  getMyEnrollments,
  markLessonComplete,
} from "../controllers/enrollmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", protect, authorize("student"), createCheckout);
router.post("/confirm", protect, authorize("student"), confirmEnrollment);
router.get("/me", protect, authorize("student"), getMyEnrollments);
router.get("/:enrollmentId/course", protect, authorize("student"), getEnrollmentCourse);
router.patch("/:enrollmentId/progress", protect, authorize("student"), markLessonComplete);

export default router;
