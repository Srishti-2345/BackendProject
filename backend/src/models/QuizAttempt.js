import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 4,
        message: "Each quiz question must include exactly four options",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      default: null,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [Number],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicSlug: {
      type: String,
      required: true,
      trim: true,
      default: "general",
    },
    sourceType: {
      type: String,
      enum: ["pdf", "video_url"],
      required: true,
    },
    sourceLabel: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    sourceExcerpt: {
      type: String,
      default: "",
    },
    generatedByModel: {
      type: String,
      default: "",
    },
    questions: {
      type: [quizQuestionSchema],
      default: [],
    },
    result: {
      type: quizResultSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
