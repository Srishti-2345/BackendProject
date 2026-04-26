import express from "express";

import {
  createBlogDraft,
  getBlogBySlug,
  getMyBlogDrafts,
  getPublishedBlogs,
  updateBlogDraft,
} from "../controllers/blogController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublishedBlogs);
router.get("/me", protect, authorize("student", "instructor"), getMyBlogDrafts);
router.get("/slug/:slug", getBlogBySlug);
router.post("/", protect, authorize("student", "instructor"), createBlogDraft);
router.put("/:blogId", protect, authorize("student", "instructor"), updateBlogDraft);

export default router;

