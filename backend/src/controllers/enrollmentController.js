import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Order from "../models/Order.js";
import { awardXp } from "../utils/progression.js";

const createInitialProgress = (course) =>
  course.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      lessonTitle: lesson.title,
      completed: false,
    }))
  );

export const createCheckout = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course || course.status !== "published") {
      const error = new Error("Course not available for enrollment");
      error.statusCode = 404;
      throw error;
    }

    const order = await Order.create({
      student: req.user._id,
      course: course._id,
      amount: course.price,
    });

    res.status(201).json({
      success: true,
      order,
      message: "Demo checkout created. Integrate a real payment gateway here.",
    });
  } catch (error) {
    next(error);
  }
};

export const confirmEnrollment = async (req, res, next) => {
  try {
    const { courseId, orderId } = req.body;

    const course = await Course.findById(courseId);
    const order = await Order.findById(orderId);

    if (!course || !order) {
      const error = new Error("Course or order not found");
      error.statusCode = 404;
      throw error;
    }

    if (
      String(order.student) !== String(req.user._id) ||
      String(order.course) !== String(course._id)
    ) {
      const error = new Error("Order does not belong to this student or course");
      error.statusCode = 403;
      throw error;
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.json({
        success: true,
        enrollment: existingEnrollment,
        message: "Already enrolled in this course",
      });
    }

    order.status = "paid";
    await order.save();

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      amountPaid: course.price,
      paymentStatus: "paid",
      progress: createInitialProgress(course),
    });

    course.enrolledCount += 1;
    await course.save();

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    next(error);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: "course",
        populate: { path: "instructor", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentCourse = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.enrollmentId,
      student: req.user._id,
    }).populate({
      path: "course",
      populate: { path: "instructor", select: "name bio avatarUrl" },
    });

    if (!enrollment) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    next(error);
  }
};

export const markLessonComplete = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { lessonTitle, completed } = req.body;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: req.user._id,
    });

    if (!enrollment) {
      const error = new Error("Enrollment not found");
      error.statusCode = 404;
      throw error;
    }

    const previousLesson = enrollment.progress.find((item) => item.lessonTitle === lessonTitle);
    const previousCompletionPercentage = enrollment.completionPercentage;
    enrollment.progress = enrollment.progress.map((item) =>
      item.lessonTitle === lessonTitle ? { ...item.toObject(), completed } : item
    );

    const completedLessons = enrollment.progress.filter((item) => item.completed).length;
    enrollment.completionPercentage = enrollment.progress.length
      ? Math.round((completedLessons / enrollment.progress.length) * 100)
      : 0;

    await enrollment.save();
    await enrollment.populate({
      path: "course",
      populate: { path: "instructor", select: "name" },
    });

    if (completed && previousLesson && !previousLesson.completed) {
      await awardXp({
        user: req.user,
        topicSlug: enrollment.course.topicSlug,
        xp: 20,
        sourceType: "lesson_watch",
        metadata: { enrollmentId: enrollment._id, lessonTitle },
      });
    }

    if (previousCompletionPercentage < 100 && enrollment.completionPercentage === 100) {
      await awardXp({
        user: req.user,
        topicSlug: enrollment.course.topicSlug,
        xp: 120,
        sourceType: "course_completion",
        metadata: { enrollmentId: enrollment._id, courseId: enrollment.course._id },
      });
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    next(error);
  }
};
