import BlogPost from "../models/BlogPost.js";
import Course from "../models/Course.js";
import CreatorApplication from "../models/CreatorApplication.js";
import DiscussionThread from "../models/DiscussionThread.js";
import Topic from "../models/Topic.js";
import { awardXp, getTopicStat, syncUploaderUnlock } from "../utils/progression.js";

export const getCreatorReadiness = async (req, res, next) => {
  try {
    const topics = await Topic.find({ isActive: true }).sort({ name: 1 });

    const readiness = [];
    for (const topic of topics) {
      await syncUploaderUnlock(req.user, topic.slug);
      const stat = getTopicStat(req.user, topic.slug);
      const application = await CreatorApplication.findOne({
        applicant: req.user._id,
        topicSlug: topic.slug,
      });

      readiness.push({
        topic,
        stat,
        application,
        meetsRequirements:
          stat.xp >= topic.uploaderRequirements.xpThreshold &&
          stat.challengeSolvedCount >= topic.uploaderRequirements.challengeSolvedThreshold &&
          stat.mediumSolvedCount >= topic.uploaderRequirements.mediumSolvedThreshold,
      });
    }

    res.json({ success: true, readiness });
  } catch (error) {
    next(error);
  }
};

export const applyForCreator = async (req, res, next) => {
  try {
    const { topicSlug, statement, requestedLevel = 1 } = req.body;
    const topic = await Topic.findOne({ slug: topicSlug });

    if (!topic) {
      const error = new Error("Topic not found");
      error.statusCode = 404;
      throw error;
    }

    await syncUploaderUnlock(req.user, topicSlug);
    const stat = getTopicStat(req.user, topicSlug);

    if (!stat.uploaderUnlocked) {
      const error = new Error("You have not unlocked creator access for this topic yet");
      error.statusCode = 403;
      throw error;
    }

    const application = await CreatorApplication.findOneAndUpdate(
      { applicant: req.user._id, topicSlug },
      {
        applicant: req.user._id,
        topicSlug,
        requestedLevel,
        statement,
        status: "pending",
        reviewerNotes: "",
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

export const getCreatorDashboard = async (req, res, next) => {
  try {
    const [applications, courses, blogs, discussions] = await Promise.all([
      CreatorApplication.find({ applicant: req.user._id }).sort({ createdAt: -1 }),
      Course.find({ instructor: req.user._id }).sort({ updatedAt: -1 }),
      BlogPost.find({ author: req.user._id }).sort({ updatedAt: -1 }),
      DiscussionThread.find({}).sort({ createdAt: -1 }).limit(8).populate("author", "name"),
    ]);

    const contentPipeline = {
      drafts: blogs.filter((item) => item.status === "draft").length,
      underReview: blogs.filter((item) => item.status === "pending_review").length,
      needsChanges: blogs.filter((item) => item.status === "needs_changes").length,
      published: blogs.filter((item) => item.status === "published").length,
    };

    const creatorPerformance = {
      totalCourseViewsEstimate: courses.reduce((sum, item) => sum + item.enrolledCount * 9, 0),
      totalBlogViews: blogs.reduce((sum, item) => sum + item.engagement.views, 0),
      creatorReputation: req.user.creatorReputation,
    };

    res.json({
      success: true,
      applications,
      courses,
      blogs,
      discussions,
      contentPipeline,
      creatorPerformance,
    });
  } catch (error) {
    next(error);
  }
};

export const approveCreatorApplication = async (req, res, next) => {
  try {
    const application = await CreatorApplication.findById(req.params.applicationId).populate(
      "applicant"
    );
    if (!application) {
      const error = new Error("Application not found");
      error.statusCode = 404;
      throw error;
    }

    application.status = "approved";
    application.reviewerNotes = req.body.reviewerNotes || "";
    await application.save();

    const applicant = application.applicant;
    applicant.creatorReputation += 100;
    await awardXp({
      user: applicant,
      topicSlug: application.topicSlug,
      xp: 120,
      sourceType: "content_approved",
      metadata: { applicationId: application._id },
    });

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};
