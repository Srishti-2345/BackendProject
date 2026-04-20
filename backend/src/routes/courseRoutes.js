import express from "express";

import {
  createCourse,
  getCourseBySlug,
  getInstructorAnalytics,
  getInstructorCourses,
  getPublishedCourses,
  updateCourse,
} from "../controllers/courseController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublishedCourses);
router.get("/slug/:slug", getCourseBySlug);
router.get("/instructor/me", protect, authorize("student", "instructor"), getInstructorCourses);
router.get(
  "/instructor/analytics",
  protect,
  authorize("student", "instructor"),
  getInstructorAnalytics
);
router.post("/", protect, authorize("student", "instructor"), createCourse);
router.put("/:courseId", protect, authorize("student", "instructor"), updateCourse);

export default router;
