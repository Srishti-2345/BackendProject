import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { assertTopicContributorAccess } from "../utils/contributorAccess.js";

const buildSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getPublishedCourses = async (req, res, next) => {
  try {
    const { search = "", category = "", topic = "" } = req.query;

    const query = {
      status: "published",
      title: { $regex: search, $options: "i" },
    };

    if (category) {
      query.category = category;
    }

    if (topic) {
      query.topicSlug = topic;
    }

    const courses = await Course.find(query)
      .populate("instructor", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
};

export const getCourseBySlug = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug }).populate(
      "instructor",
      "name bio avatarUrl"
    );

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      category,
      topicSlug,
      level,
      thumbnailUrl,
      price,
      learningOutcomes = [],
      requirements = [],
      sections = [],
      status = "draft",
    } = req.body;

    if (!title || !description || !category || !topicSlug) {
      const error = new Error("Title, description, category, and topic are required");
      error.statusCode = 400;
      throw error;
    }

    await assertTopicContributorAccess(req.user, topicSlug);

    const baseSlug = buildSlug(title);
    const similarCount = await Course.countDocuments({
      slug: { $regex: `^${baseSlug}` },
    });

    const course = await Course.create({
      title,
      slug: similarCount ? `${baseSlug}-${similarCount + 1}` : baseSlug,
      subtitle,
      description,
      category,
      topicSlug,
      level,
      thumbnailUrl,
      price,
      learningOutcomes,
      requirements,
      sections,
      status,
      instructor: req.user._id,
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(course.instructor) !== String(req.user._id)) {
      const error = new Error("You can only edit your own course");
      error.statusCode = 403;
      throw error;
    }

    Object.assign(course, req.body);
    await course.save();

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

export const getInstructorAnalytics = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    const revenue = enrollments.reduce(
      (sum, item) => sum + (item.paymentStatus === "paid" ? item.amountPaid : 0),
      0
    );

    res.json({
      success: true,
      analytics: {
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalRevenue: revenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
