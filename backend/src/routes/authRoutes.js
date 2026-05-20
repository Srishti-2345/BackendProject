import express from "express";

import {
  getCurrentUser,
  loginUser,
  loginWithGoogle,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle);
router.get("/me", protect, getCurrentUser);

export default router;
