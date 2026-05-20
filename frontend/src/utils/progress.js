export const getEnrollmentCompletionPercentage = (enrollment) => {
  if (Number.isFinite(enrollment?.completionPercentage)) {
    return enrollment.completionPercentage;
  }

  const progressItems = Array.isArray(enrollment?.progress) ? enrollment.progress : [];
  if (!progressItems.length) {
    return 0;
  }

  const completedLessons = progressItems.filter((item) => item?.completed).length;
  return Math.round((completedLessons / progressItems.length) * 100);
};
