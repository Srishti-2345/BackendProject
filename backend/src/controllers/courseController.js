import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { normalizeCourseDocument, normalizeCoursePayload } from "../utils/courseSchema.js";
import { assertTopicContributorAccess } from "../utils/contributorAccess.js";

const buildSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseDurationToMinutes = (value = "") => {
  if (!value || typeof value !== "string") {
    return 0;
  }

  const parts = value
    .split(":")
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item));

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes + Math.ceil((seconds || 0) / 60);
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 60 + minutes + Math.ceil((seconds || 0) / 60);
  }

  return 0;
};

const getCourseDurationMinutes = (course) =>
  (course.sections || []).reduce(
    (sectionTotal, section) =>
      sectionTotal +
      (section.lessons || []).reduce(
        (lessonTotal, lesson) => lessonTotal + parseDurationToMinutes(lesson.duration),
        0
      ),
    0
  );

const formatDurationLabel = (totalMinutes) => {
  if (!totalMinutes) {
    return "Self-paced";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const matchesPriceRange = (price, priceRange) => {
  if (!priceRange || priceRange === "all") {
    return true;
  }

  if (priceRange === "free") {
    return price === 0;
  }

  if (priceRange === "under-1000") {
    return price > 0 && price <= 1000;
  }

  if (priceRange === "1001-1500") {
    return price > 1000 && price <= 1500;
  }

  if (priceRange === "1500-plus") {
    return price > 1500;
  }

  return true;
};

const matchesDurationRange = (totalMinutes, durationRange) => {
  if (!durationRange || durationRange === "all") {
    return true;
  }

  if (durationRange === "0-2") {
    return totalMinutes <= 120;
  }

  if (durationRange === "3-6") {
    return totalMinutes > 120 && totalMinutes <= 360;
  }

  if (durationRange === "7-16") {
    return totalMinutes > 360 && totalMinutes <= 960;
  }

  if (durationRange === "17-plus") {
    return totalMinutes > 960;
  }

  return true;
};

export const getPublishedCourses = async (req, res, next) => {
  try {
    const {
      search = "",
      category = "",
      topic = "",
      levels = "",
      priceRange = "all",
      durationRange = "all",
    } = req.query;

    const selectedLevels = String(levels)
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

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

    if (selectedLevels.length) {
      query.level = { $in: selectedLevels };
    }

    const courses = await Course.find(query)
      .populate("instructor", "name")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedCourses = courses
      .map((rawCourse) => {
        const course = normalizeCourseDocument(rawCourse);
        const totalDurationMinutes = getCourseDurationMinutes(course);

        return {
          ...course,
          totalDurationMinutes,
          totalDurationLabel: formatDurationLabel(totalDurationMinutes),
        };
      })
      .filter(
        (course) =>
          matchesPriceRange(course.price, priceRange) &&
          matchesDurationRange(course.totalDurationMinutes, durationRange)
      );

    res.json({ success: true, courses: enrichedCourses });
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

    res.json({ success: true, course: normalizeCourseDocument(course) });
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
      learningOutcomes,
      requirements,
      sections,
      status = "draft",
    } = normalizeCoursePayload(req.body);

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

    res.status(201).json({ success: true, course: normalizeCourseDocument(course) });
  } catch (error) {
    next(error);
  }
};

export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, courses: courses.map((course) => normalizeCourseDocument(course)) });
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

    const normalizedPayload = normalizeCoursePayload({
      ...course.toObject(),
      ...req.body,
    });
    const nextTopicSlug = normalizedPayload.topicSlug || course.topicSlug;
    await assertTopicContributorAccess(req.user, nextTopicSlug);

    Object.assign(course, normalizedPayload);
    await course.save();

    res.json({ success: true, course: normalizeCourseDocument(course) });
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
