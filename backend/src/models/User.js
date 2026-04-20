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
      enum: ["student", "instructor"],
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
            challengeSolvedCount: {
              type: Number,
              default: 0,
            },
            mediumSolvedCount: {
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
