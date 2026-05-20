import { callFreeModelJson, getFreeModelSettings } from "./freeModelClient.js";

const MAX_RECOMMENDED_TOPICS = 3;
const MAX_RESUME_CHARACTERS = 16000;
const MAX_AI_SUGGESTED_TOPICS = 5;

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

const buildSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeAiSuggestedTopics = (topics = [], existingTopics = []) => {
  const existingBySlug = new Map(existingTopics.map((topic) => [topic.slug, topic]));
  const existingByName = new Map(
    existingTopics.map((topic) => [String(topic.name || "").toLowerCase().trim(), topic])
  );
  const seen = new Set();

  return topics
    .map((item) => {
      const rawName = typeof item === "string" ? item : item?.name;
      const rawSlug = typeof item === "string" ? "" : item?.slug;
      const matchedExisting =
        existingBySlug.get(String(rawSlug || "").trim()) ||
        existingByName.get(String(rawName || "").toLowerCase().trim());

      const name = String(matchedExisting?.name || rawName || "").trim();
      const slug = String(matchedExisting?.slug || rawSlug || buildSlug(name)).trim();

      if (!name || !slug) {
        return null;
      }

      return {
        slug,
        name,
        category: String(matchedExisting?.category || item?.category || "General").trim() || "General",
        description: String(matchedExisting?.description || item?.description || "").trim(),
        isNewTopic: !matchedExisting,
      };
    })
    .filter((item) => {
      if (!item || seen.has(item.slug)) {
        return false;
      }

      seen.add(item.slug);
      return true;
    })
    .slice(0, MAX_AI_SUGGESTED_TOPICS);
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
  const aiSuggestedTopics = normalizeAiSuggestedTopics(
    scoredTopics.slice(0, MAX_RECOMMENDED_TOPICS).map((topic) => ({
      slug: topic.slug,
      name: topic.name,
    })),
    topics
  );
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
    aiSuggestedTopics,
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
    "Use the provided topics when they fit the resume strongly.",
    "If the resume clearly shows skill in a relevant topic that does not exist yet, you may suggest a new topic.",
    "Approve only when the resume shows credible evidence of skill, project work, teaching, or professional exposure for at least one topic.",
    "Recommend up to three existing topics and up to five total AI-suggested topics, ranked strongest first.",
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
  "aiSuggestedTopics": [
    {
      "name": "Topic name",
      "slug": "topic-slug",
      "category": "Category",
      "description": "Short topic description"
    }
  ],
  "analysisSummary": "string",
  "reviewHighlights": ["string"]
}`,
    schemaName: "resume_topic_review",
  });
  const normalizedTopics = Array.isArray(review.recommendedTopics)
    ? review.recommendedTopics.filter((slug) => allowedTopicSlugs.includes(slug))
    : [];
  const normalizedAiSuggestedTopics = normalizeAiSuggestedTopics(review.aiSuggestedTopics, topics);

  return {
    status: normalizedTopics.length || normalizedAiSuggestedTopics.length ? review.status : "rejected",
    recommendedTopics: normalizedTopics,
    aiSuggestedTopics: normalizedAiSuggestedTopics,
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
      aiSuggestedTopics: [],
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
