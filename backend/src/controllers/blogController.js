import BlogPost from "../models/BlogPost.js";
import { assertTopicContributorAccess } from "../utils/contributorAccess.js";

const buildSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getPublishedBlogs = async (_req, res, next) => {
  try {
    const blogs = await BlogPost.find({ status: "published" })
      .populate("author", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, blogs });
  } catch (error) {
    next(error);
  }
};

export const getMyBlogDrafts = async (req, res, next) => {
  try {
    const blogs = await BlogPost.find({ author: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    next(error);
  }
};

export const createBlogDraft = async (req, res, next) => {
  try {
    const { title, excerpt, content, topicSlug, status = "draft" } = req.body;

    if (!title || !content || !topicSlug) {
      const error = new Error("Title, content, and topic are required");
      error.statusCode = 400;
      throw error;
    }

    await assertTopicContributorAccess(req.user, topicSlug);

    const baseSlug = buildSlug(title);
    const similarCount = await BlogPost.countDocuments({
      slug: { $regex: `^${baseSlug}` },
    });

    const blog = await BlogPost.create({
      title,
      slug: similarCount ? `${baseSlug}-${similarCount + 1}` : baseSlug,
      excerpt,
      content,
      topicSlug,
      author: req.user._id,
      status,
    });

    res.status(201).json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await BlogPost.findOne({ slug: req.params.slug, status: "published" }).populate(
      "author",
      "name"
    );
    if (!blog) {
      const error = new Error("Blog not found");
      error.statusCode = 404;
      throw error;
    }

    blog.engagement.views += 1;
    await blog.save();

    res.json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};

export const updateBlogDraft = async (req, res, next) => {
  try {
    const blog = await BlogPost.findById(req.params.blogId);

    if (!blog) {
      const error = new Error("Blog not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(blog.author) !== String(req.user._id)) {
      const error = new Error("You can only edit your own blog");
      error.statusCode = 403;
      throw error;
    }

    const nextTopicSlug = req.body.topicSlug || blog.topicSlug;
    await assertTopicContributorAccess(req.user, nextTopicSlug);

    Object.assign(blog, req.body);
    await blog.save();

    res.json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};
