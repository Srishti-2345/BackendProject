import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    uploaderRequirements: {
      xpThreshold: {
        type: Number,
        default: 1500,
      },
      challengeSolvedThreshold: {
        type: Number,
        default: 20,
      },
      mediumSolvedThreshold: {
        type: Number,
        default: 5,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Topic = mongoose.model("Topic", topicSchema);

export default Topic;

