import { callFreeModelJson, getFreeModelSettings } from "./freeModelClient.js";

const MAX_RECOMMENDED_TOPICS = 3;
const MAX_RESUME_CHARACTERS = 16000;

const topicKeywordMap = {
  react: ["react", "frontend", "javascript", "jsx", "hooks", "redux", "vite", "component", "ui"],
  "data-structures": [
    "data structures",
    "algorithms",
    "dsa",
    "array",
    "string",
    "hashmap",
    "tree",
    "graph",
    "problem solving",
    "competitive programming",
  ],
};

const countOccurrences = (source, keyword) => {
  const matches = source.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
  return matches ? matches.length : 0;
};

const buildHeuristicReview = ({ topics, resumeText, experienceSummary = "" }) => {
  const source = `${resumeText}\n${experienceSummary}`.toLowerCase();

  const scoredTopics = topics
    .map((topic) => {
      const builtInKeywords = topicKeywordMap[topic.slug] || [];
      const dynamicKeywords = [
        topic.name,
        topic.slug.replace(/-/g, " "),
        topic.category,
        ...(topic.description ? topic.description.split(/[^\w+]+/) : []),
      ]
        .map((item) => String(item || "").toLowerCase().trim())
        .filter((item) => item.length >= 4);

      const uniqueKeywords = [...new Set([...builtInKeywords, ...dynamicKeywords])];
      const score = uniqueKeywords.reduce((sum, keyword) => sum + countOccurrences(source, keyword), 0);

      return {
        slug: topic.slug,
        name: topic.name,
        score,
      };
    })
    .filter((topic) => topic.score > 0)
    .sort((left, right) => right.score - left.score);

  const recommendedTopics = scoredTopics.slice(0, MAX_RECOMMENDED_TOPICS).map((topic) => topic.slug);
  const strongestTopicNames = scoredTopics
    .slice(0, MAX_RECOMMENDED_TOPICS)
    .map((topic) => topic.name);

  const reviewHighlights = [];
  if (/mentor|teach|trainer|instructor|educator/i.test(source)) {
    reviewHighlights.push("Teaching or mentoring experience detected.");
  }
  if (/project|production|deployed|shipped|internship|freelance/i.test(source)) {
    reviewHighlights.push("Hands-on project or production work mentioned.");
  }
  if (/react|javascript|frontend|node|mongodb|express/i.test(source)) {
    reviewHighlights.push("Strong web development signal found in the resume.");
  }
  if (/algorithm|problem solving|data structure|competitive/i.test(source)) {
    reviewHighlights.push("Problem-solving and algorithmic practice identified.");
  }

  const status = recommendedTopics.length ? "approved" : "rejected";
  const analysisSummary = recommendedTopics.length
    ? `Resume matched best with ${strongestTopicNames.join(", ")} based on keywords, role history, and project experience.`
    : "Resume did not contain enough topic-specific signals to auto-approve contribution access.";

  return {
    status,
    recommendedTopics,
    analysisSummary,
    reviewHighlights,
  };
};

const trimResumeText = (resumeText = "") =>
  resumeText.trim().slice(0, MAX_RESUME_CHARACTERS);

const buildPrompt = ({ topics, resumeText, experienceSummary }) => {
  const topicCatalog = topics.map((topic) => ({
    slug: topic.slug,
    name: topic.name,
    category: topic.category,
    description: topic.description || "",
  }));

  return [
    "Review this resume for topic-specific contributor access.",
    "Choose only from the provided topics.",
    "Approve only when the resume shows credible evidence of skill, project work, teaching, or professional exposure for at least one topic.",
    "Recommend up to three topics, ranked strongest first.",
    "",
    `Available topics: ${JSON.stringify(topicCatalog)}`,
    "",
    `Experience summary: ${experienceSummary || "Not provided."}`,
    "",
    `Resume text: ${trimResumeText(resumeText) || "No resume text extracted."}`,
  ].join("\n");
};

const callFreeResumeReview = async ({ topics, resumeText, experienceSummary = "" }) => {
  const allowedTopicSlugs = topics.map((topic) => topic.slug);
  const { model, data: review } = await callFreeModelJson({
    systemPrompt:
      "You review resumes and decide which learning-platform topics should be unlocked for contribution. Be conservative, factual, and only use the provided topics.",
    userPrompt: `${buildPrompt({ topics, resumeText, experienceSummary })}

Return JSON with this exact shape:
{
  "status": "approved",
  "recommendedTopics": ["topic-slug"],
  "analysisSummary": "string",
  "reviewHighlights": ["string"]
}`,
    schemaName: "resume_topic_review",
  });
  const normalizedTopics = Array.isArray(review.recommendedTopics)
    ? review.recommendedTopics.filter((slug) => allowedTopicSlugs.includes(slug))
    : [];

  return {
    status: normalizedTopics.length ? review.status : "rejected",
    recommendedTopics: normalizedTopics,
    analysisSummary: String(review.analysisSummary || "").trim(),
    reviewHighlights: Array.isArray(review.reviewHighlights)
      ? review.reviewHighlights.map((item) => String(item).trim()).filter(Boolean)
      : [],
    model,
  };
};

export const reviewOpenLearnApplication = async ({ topics, resumeText, experienceSummary = "" }) => {
  if (!topics.length) {
    return {
      status: "rejected",
      recommendedTopics: [],
      analysisSummary: "No active topics are available for contributor review yet.",
      reviewHighlights: [],
    };
  }

  try {
    return await callFreeResumeReview({ topics, resumeText, experienceSummary });
  } catch (error) {
    if (!getFreeModelSettings().fallbackEnabled) {
      throw error;
    }

    const fallback = buildHeuristicReview({ topics, resumeText, experienceSummary });

    return {
      ...fallback,
      analysisSummary: `${fallback.analysisSummary} AI resume review was unavailable, so keyword fallback was used.`,
    };
  }
};
