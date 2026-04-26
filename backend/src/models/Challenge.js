import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    expectedOutput: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
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
    topicSlug: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    prompt: {
      type: String,
      required: true,
    },
    constraints: {
      type: [String],
      default: [],
    },
    examples: {
      type: [String],
      default: [],
    },
    xpReward: {
      type: Number,
      default: 100,
    },
    tags: {
      type: [String],
      default: [],
    },
    functionName: {
      type: String,
      default: "solution",
    },
    starterCode: {
      type: String,
      default: "function solution() {\n  \n}\n\nmodule.exports = solution;",
    },
    publicTestCases: {
      type: [testCaseSchema],
      default: [],
    },
    hiddenTestCases: {
      type: [testCaseSchema],
      default: [],
      select: false,
    },
    editorial: {
      type: String,
      default: "",
    },
    solveCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", challengeSchema);

export default Challenge;
