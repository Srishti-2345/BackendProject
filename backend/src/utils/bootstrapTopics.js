import Topic from "../models/Topic.js";

const defaultTopics = [
  {
    name: "General",
    slug: "general",
    description: "Topic-neutral quizzes generated from uploaded study material.",
    category: "General",
    uploaderRequirements: {
      xpThreshold: 400,
      quizCompletedThreshold: 1,
      masteredQuizThreshold: 1,
    },
  },
  {
    name: "React",
    slug: "react",
    description: "Component architecture, state management, and frontend workflows.",
    category: "Web Development",
    uploaderRequirements: {
      xpThreshold: 600,
      quizCompletedThreshold: 2,
      masteredQuizThreshold: 1,
    },
  },
  {
    name: "Data Structures",
    slug: "data-structures",
    description: "Arrays, strings, maps, and problem-solving patterns.",
    category: "Programming",
    uploaderRequirements: {
      xpThreshold: 800,
      quizCompletedThreshold: 3,
      masteredQuizThreshold: 1,
    },
  },
];

export const ensureDefaultTopics = async () => {
  await Promise.all(
    defaultTopics.map((topic) =>
      Topic.findOneAndUpdate(
        { slug: topic.slug },
        {
          ...topic,
          isActive: true,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )
    )
  );
};
