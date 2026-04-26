import mongoose from "mongoose";

const personalDetailsSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    currentRole: {
      type: String,
      default: "",
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },
    portfolioUrl: {
      type: String,
      default: "",
      trim: true,
    },
    education: {
      type: String,
      default: "",
      trim: true,
    },
    experienceSummary: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const openLearnApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    personalDetails: {
      type: personalDetailsSchema,
      required: true,
    },
    resumeFile: {
      originalName: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        default: "",
      },
      size: {
        type: Number,
        default: 0,
      },
    },
    resumeText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    analysisSummary: {
      type: String,
      default: "",
    },
    reviewHighlights: {
      type: [String],
      default: [],
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

openLearnApplicationSchema.index({ applicant: 1, createdAt: -1 });

const OpenLearnApplication = mongoose.model("OpenLearnApplication", openLearnApplicationSchema);

export default OpenLearnApplication;
