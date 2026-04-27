import express from "express";

import {
  confirmEnrollment,
  deleteEnrollmentNote,
  createCheckout,
  getEnrollmentCourse,
  getEnrollmentNotes,
  getMyEnrollments,
  markLessonComplete,
  saveEnrollmentNote,
} from "../controllers/enrollmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", protect, authorize("student"), createCheckout);
router.post("/confirm", protect, authorize("student"), confirmEnrollment);
router.get("/me", protect, authorize("student"), getMyEnrollments);
router.get("/:enrollmentId/course", protect, authorize("student"), getEnrollmentCourse);
router.get("/:enrollmentId/notes", protect, authorize("student"), getEnrollmentNotes);
router.patch("/:enrollmentId/progress", protect, authorize("student"), markLessonComplete);
router.put("/:enrollmentId/notes", protect, authorize("student"), saveEnrollmentNote);
router.delete("/:enrollmentId/notes", protect, authorize("student"), deleteEnrollmentNote);

export default router;
