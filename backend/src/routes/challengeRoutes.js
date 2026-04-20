import express from "express";

import {
  getChallengeBySlug,
  getChallenges,
  getMyChallengeSubmissions,
  runChallengeCode,
  submitChallenge,
} from "../controllers/challengeController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getChallenges);
router.get("/slug/:slug", getChallengeBySlug);
router.get(
  "/:challengeId/submissions",
  protect,
  authorize("student", "instructor"),
  getMyChallengeSubmissions
);
router.post("/:challengeId/run", protect, authorize("student", "instructor"), runChallengeCode);
router.post("/:challengeId/submit", protect, authorize("student", "instructor"), submitChallenge);

export default router;
