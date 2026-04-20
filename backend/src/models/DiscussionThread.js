import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const discussionThreadSchema = new mongoose.Schema(
  {
    contextType: {
      type: String,
      enum: ["course", "blog"],
      required: true,
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      enum: ["question", "help", "tips", "review", "project_showcase"],
      default: "question",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["open", "solved"],
      default: "open",
    },
    replies: {
      type: [replySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const DiscussionThread = mongoose.model("DiscussionThread", discussionThreadSchema);

export default DiscussionThread;

