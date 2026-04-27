import mongoose from "mongoose";

const xpEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicSlug: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: [
        "lesson_watch",
        "course_completion",
        "quiz_completed",
        "discussion_helpful",
        "content_approved",
        "streak_bonus",
      ],
      required: true,
    },
    xp: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const XPEvent = mongoose.model("XPEvent", xpEventSchema);

export default XPEvent;
