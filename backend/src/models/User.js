import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "reviewer"],
      default: "student",
    },
    bio: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    streak: {
      type: Number,
      default: 0,
    },
    creatorReputation: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    contributorAccess: {
      openLearnApplicationStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      approvedTopics: {
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
      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    topicStats: {
      type: [
        new mongoose.Schema(
          {
            topicSlug: {
              type: String,
              required: true,
            },
            xp: {
              type: Number,
              default: 0,
            },
            level: {
              type: Number,
              default: 1,
            },
            quizCompletedCount: {
              type: Number,
              default: 0,
            },
            masteredQuizCount: {
              type: Number,
              default: 0,
            },
            uploaderUnlocked: {
              type: Boolean,
              default: false,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    learningNotes: {
      type: [
        new mongoose.Schema(
          {
            enrollmentId: {
              type: String,
              required: true,
            },
            lessonTitle: {
              type: String,
              required: true,
            },
            content: {
              type: String,
              default: "",
            },
            updatedAt: {
              type: Date,
              default: Date.now,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
