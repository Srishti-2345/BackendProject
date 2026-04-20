import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    topicSlug: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending_review", "needs_changes", "published", "rejected"],
      default: "draft",
    },
    feedback: {
      type: String,
      default: "",
    },
    engagement: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;

