import express from "express";

import { generateQuiz, getQuizHistory, submitQuiz } from "../controllers/quizController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { pdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/history", protect, authorize("student", "instructor"), getQuizHistory);
router.post(
  "/generate",
  protect,
  authorize("student", "instructor"),
  pdfUpload.single("pdf"),
  generateQuiz
);
router.post("/:attemptId/submit", protect, authorize("student", "instructor"), submitQuiz);

export default router;
