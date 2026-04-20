import Topic from "../models/Topic.js";
import XPEvent from "../models/XPEvent.js";

export const calculateLevel = (xp) => Math.max(1, Math.floor(xp / 500) + 1);

export const getTopicStat = (user, topicSlug) => {
  let stat = user.topicStats.find((item) => item.topicSlug === topicSlug);

  if (!stat) {
    user.topicStats.push({
      topicSlug,
      xp: 0,
      level: 1,
      challengeSolvedCount: 0,
      mediumSolvedCount: 0,
      uploaderUnlocked: false,
    });
    stat = user.topicStats[user.topicStats.length - 1];
  }

  return stat;
};

export const syncUploaderUnlock = async (user, topicSlug) => {
  const topic = await Topic.findOne({ slug: topicSlug });
  if (!topic) {
    return null;
  }

  const stat = getTopicStat(user, topicSlug);
  stat.level = calculateLevel(stat.xp);

  if (
    stat.xp >= topic.uploaderRequirements.xpThreshold &&
    stat.challengeSolvedCount >= topic.uploaderRequirements.challengeSolvedThreshold &&
    stat.mediumSolvedCount >= topic.uploaderRequirements.mediumSolvedThreshold
  ) {
    stat.uploaderUnlocked = true;
  }

  return stat;
};

export const awardXp = async ({ user, topicSlug, xp, sourceType, metadata = {} }) => {
  const stat = getTopicStat(user, topicSlug);
  stat.xp += xp;
  stat.level = calculateLevel(stat.xp);

  await XPEvent.create({
    user: user._id,
    topicSlug,
    xp,
    sourceType,
    metadata,
  });

  await syncUploaderUnlock(user, topicSlug);
  await user.save();

  return stat;
};

