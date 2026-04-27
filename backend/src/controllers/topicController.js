import BlogPost from "../models/BlogPost.js";
import Course from "../models/Course.js";
import CreatorApplication from "../models/CreatorApplication.js";
import Topic from "../models/Topic.js";
import XPEvent from "../models/XPEvent.js";
import { getTopicContributionAccess, hasOpenLearnEmail } from "../utils/contributorAccess.js";
import { getTopicStat, syncUploaderUnlock } from "../utils/progression.js";

export const getTopics = async (_req, res, next) => {
  try {
    const topics = await Topic.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, topics });
  } catch (error) {
    next(error);
  }
};

export const getTopicOverview = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.slug });
    if (!topic) {
      const error = new Error("Topic not found");
      error.statusCode = 404;
      throw error;
    }

    const [courses, blogs] = await Promise.all([
      Course.find({ category: topic.name, status: "published" }).populate("instructor", "name"),
      BlogPost.find({ topicSlug: topic.slug, status: "published" }).populate("author", "name"),
    ]);

    let topicProgress = null;
    let application = null;

    if (req.user) {
      await syncUploaderUnlock(req.user, topic.slug);
      topicProgress = getTopicStat(req.user, topic.slug);
      application = await CreatorApplication.findOne({
        applicant: req.user._id,
        topicSlug: topic.slug,
      });
    }

    const access = req.user ? await getTopicContributionAccess(req.user, topic.slug) : null;

    res.json({
      success: true,
      topic,
      courses,
      blogs,
      topicProgress,
      application,
      contributorAccess: access
        ? {
            allowed: access.allowed,
            source: access.source,
            hasOpenLearnEmail: hasOpenLearnEmail(req.user.email),
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

export const getLearnerDashboard = async (req, res, next) => {
  try {
    const [xpEvents, applications] = await Promise.all([
      XPEvent.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(12),
      CreatorApplication.find({ applicant: req.user._id }).sort({ createdAt: -1 }),
    ]);

    const recommendations = await Course.find({ status: "published" })
      .populate("instructor", "name")
      .sort({ enrolledCount: -1 })
      .limit(4);

    res.json({
      success: true,
      profile: {
        streak: req.user.streak,
        badges: req.user.badges,
        creatorReputation: req.user.creatorReputation,
        topicStats: req.user.topicStats,
      },
      xpEvents,
      applications,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};
