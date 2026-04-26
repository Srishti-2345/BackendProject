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

export const reviewOpenLearnApplication = ({ topics, resumeText, experienceSummary = "" }) => {
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

  const recommendedTopics = scoredTopics.slice(0, 3).map((topic) => topic.slug);
  const strongestTopicNames = scoredTopics.slice(0, 3).map((topic) => topic.name);

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
