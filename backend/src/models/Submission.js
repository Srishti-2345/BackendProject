import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    language: {
      type: String,
      default: "javascript",
    },
    code: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      enum: ["accepted", "wrong_answer", "runtime_error", "time_limit_exceeded"],
      default: "accepted",
    },
    score: {
      type: Number,
      default: 100,
    },
    plagiarismFlag: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ challenge: 1, user: 1, result: 1 });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;

