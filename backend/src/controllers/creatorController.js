import BlogPost from "../models/BlogPost.js";
import Challenge from "../models/Challenge.js";
import Course from "../models/Course.js";
import CreatorApplication from "../models/CreatorApplication.js";
import DiscussionThread from "../models/DiscussionThread.js";
import OpenLearnApplication from "../models/OpenLearnApplication.js";
import pdfParse from "pdf-parse";
import Topic from "../models/Topic.js";
import { getTopicContributionAccess, hasOpenLearnEmail } from "../utils/contributorAccess.js";
import { reviewOpenLearnApplication } from "../utils/openLearnReview.js";
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

      const access = await getTopicContributionAccess(req.user, topic.slug);

      readiness.push({
        topic,
        stat,
        application,
        contributionAccess: access.allowed,
        accessSource: access.source,
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
        status: "approved",
        reviewerNotes: "Auto-approved because the user unlocked contribution access with XP.",
        applicationType: "xp_unlock",
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
    const [applications, openLearnApplication, courses, blogs, challenges, discussions] = await Promise.all([
      CreatorApplication.find({ applicant: req.user._id }).sort({ createdAt: -1 }),
      OpenLearnApplication.findOne({ applicant: req.user._id }).sort({ createdAt: -1 }),
      Course.find({ instructor: req.user._id }).sort({ updatedAt: -1 }),
      BlogPost.find({ author: req.user._id }).sort({ updatedAt: -1 }),
      Challenge.find({ createdBy: req.user._id }).sort({ updatedAt: -1 }),
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
      openLearnApplication,
      courses,
      blogs,
      challenges,
      discussions,
      contentPipeline,
      creatorPerformance,
      contributorAccess: {
        hasOpenLearnEmail: hasOpenLearnEmail(req.user.email),
        openLearnApplicationStatus: req.user.contributorAccess?.openLearnApplicationStatus || "none",
        approvedTopics: req.user.contributorAccess?.approvedTopics || [],
        analysisSummary: req.user.contributorAccess?.analysisSummary || "",
        reviewHighlights: req.user.contributorAccess?.reviewHighlights || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const applyForOpenLearnContributor = async (req, res, next) => {
  try {
    const {
      fullName,
      phone = "",
      currentRole = "",
      yearsOfExperience = 0,
      linkedinUrl = "",
      portfolioUrl = "",
      education = "",
      experienceSummary = "",
    } = req.body;
    const resumeFile = req.file;

    if (!fullName || !resumeFile) {
      const error = new Error("Full name and a resume PDF are required");
      error.statusCode = 400;
      throw error;
    }

    const parsedResume = await pdfParse(resumeFile.buffer);
    const resumeText = parsedResume.text?.trim() || "";

    if (!resumeText) {
      const error = new Error("Could not extract readable text from the uploaded PDF");
      error.statusCode = 400;
      throw error;
    }

    const topics = await Topic.find({ isActive: true }).sort({ name: 1 });
    const review = reviewOpenLearnApplication({
      topics,
      resumeText,
      experienceSummary,
    });

    const application = await OpenLearnApplication.create({
      applicant: req.user._id,
      personalDetails: {
        fullName,
        phone,
        currentRole,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        linkedinUrl,
        portfolioUrl,
        education,
        experienceSummary,
      },
      resumeFile: {
        originalName: resumeFile.originalname,
        mimeType: resumeFile.mimetype,
        size: resumeFile.size,
      },
      resumeText,
      status: review.status,
      recommendedTopics: review.recommendedTopics,
      analysisSummary: review.analysisSummary,
      reviewHighlights: review.reviewHighlights,
      reviewNotes:
        review.status === "approved"
          ? "Auto-approved from resume-topic matching."
          : "Resume needs stronger topic-specific evidence for auto-approval.",
      reviewedAt: new Date(),
    });

    if (review.recommendedTopics.length) {
      for (const topicSlug of review.recommendedTopics) {
        await CreatorApplication.findOneAndUpdate(
          { applicant: req.user._id, topicSlug },
          {
            applicant: req.user._id,
            topicSlug,
            requestedLevel: 1,
            statement: `Auto-approved from OpenLearn application for ${topicSlug}.`,
            status: "approved",
            reviewerNotes: "Approved through OpenLearn resume analysis.",
            applicationType: "openlearn_resume",
          },
          { new: true, upsert: true }
        );
      }
    }

    const existingApprovedTopics = req.user.contributorAccess?.approvedTopics || [];
    const approvedTopics =
      review.status === "approved"
        ? [...new Set([...existingApprovedTopics, ...review.recommendedTopics])]
        : existingApprovedTopics;

    req.user.contributorAccess = {
      openLearnApplicationStatus: review.status,
      approvedTopics,
      analysisSummary: review.analysisSummary,
      reviewHighlights: review.reviewHighlights,
      reviewedAt: new Date(),
    };

    if (review.status === "approved" && !req.user.badges.includes("OpenLearn Contributor")) {
      req.user.badges.push("OpenLearn Contributor");
    }

    await req.user.save();

    res.status(201).json({
      success: true,
      application,
      contributorAccess: req.user.contributorAccess,
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
