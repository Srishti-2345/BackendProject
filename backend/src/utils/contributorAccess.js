export const getApprovedResumeTopics = (user) => user.contributorAccess?.approvedTopics || [];

export const getTopicContributionAccess = async (user, topicSlug) => {
  if (getApprovedResumeTopics(user).includes(topicSlug)) {
    return { allowed: true, source: "openlearn_resume" };
  }

  return { allowed: false, source: null };
};

export const assertTopicContributorAccess = async (user, topicSlug) => {
  const access = await getTopicContributionAccess(user, topicSlug);

  if (!access.allowed) {
    const error = new Error(
      "You can only upload content in topics approved from your resume review."
    );
    error.statusCode = 403;
    throw error;
  }

  return access;
};
