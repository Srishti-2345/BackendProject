import mongoose from "mongoose";

const creatorApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicSlug: {
      type: String,
      required: true,
    },
    requestedLevel: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
    statement: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "needs_changes", "approved", "rejected"],
      default: "pending",
    },
    reviewerNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

creatorApplicationSchema.index({ applicant: 1, topicSlug: 1 }, { unique: true });

const CreatorApplication = mongoose.model("CreatorApplication", creatorApplicationSchema);

export default CreatorApplication;
