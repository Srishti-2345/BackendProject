import CreatorApplication from "../models/CreatorApplication.js";
import { getTopicStat, syncUploaderUnlock } from "./progression.js";

export const hasOpenLearnEmail = (email = "") => email.toLowerCase().endsWith("@openlearn.com");

export const getApprovedResumeTopics = (user) => user.contributorAccess?.approvedTopics || [];

export const getTopicContributionAccess = async (user, topicSlug) => {
  if (hasOpenLearnEmail(user.email)) {
    return { allowed: true, source: "openlearn_email" };
  }

  if (getApprovedResumeTopics(user).includes(topicSlug)) {
    return { allowed: true, source: "openlearn_resume" };
  }

  const stat = await syncUploaderUnlock(user, topicSlug);
  if (stat?.uploaderUnlocked) {
    await user.save();
    return { allowed: true, source: "xp_unlock", stat: getTopicStat(user, topicSlug) };
  }

  const application = await CreatorApplication.findOne({
    applicant: user._id,
    topicSlug,
    status: "approved",
  });

  if (application) {
    return {
      allowed: true,
      source: application.applicationType || "manual_review",
      application,
    };
  }

  return { allowed: false, source: null, stat };
};

export const assertTopicContributorAccess = async (user, topicSlug) => {
  const access = await getTopicContributionAccess(user, topicSlug);

  if (!access.allowed) {
    const error = new Error(
      "You need an approved OpenLearn review, an @openlearn.com account, or enough XP in this topic to contribute."
    );
    error.statusCode = 403;
    throw error;
  }

  return access;
};
