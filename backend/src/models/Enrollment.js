import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    lessonTitle: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const lessonNoteSchema = new mongoose.Schema(
  {
    lessonKey: {
      type: String,
      required: true,
      trim: true,
    },
    lessonTitle: {
      type: String,
      required: true,
      trim: true,
    },
    sectionTitle: {
      type: String,
      default: "",
      trim: true,
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
);

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    progress: {
      type: [progressSchema],
      default: [],
    },
    lessonNotes: {
      type: [lessonNoteSchema],
      default: [],
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
