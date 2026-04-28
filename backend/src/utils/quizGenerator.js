import { extractTextFromDocument } from "./documentTextExtractor.js";
import { callFreeModelJson, getFreeModelSettings } from "./freeModelClient.js";

const DEFAULT_QUESTION_COUNT = 5;
const MIN_QUESTION_COUNT = 3;
const MAX_QUESTION_COUNT = 10;
const MAX_SOURCE_CHARACTERS = 12000;
const MIN_QUESTION_LENGTH = 25;
const MIN_EXPLANATION_LENGTH = 20;

const cleanWhitespace = (value = "") => String(value).replace(/\s+/g, " ").trim();

const trimSourceText = (value = "") => cleanWhitespace(value).slice(0, MAX_SOURCE_CHARACTERS);

const stripHtml = (html = "") =>
  cleanWhitespace(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );

const isYouTubeUrl = (value = "") => /youtube\.com|youtu\.be/i.test(value);

const dedupeStrings = (items = []) => {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const cleaned = cleanWhitespace(item);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(cleaned);
  }

  return result;
};

const buildSourceHighlights = (sourceText) => {
  const raw = String(sourceText || "");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => cleanWhitespace(line.replace(/^[-*#>\d.\s]+/, "")))
    .filter(Boolean);

  const highlightLines = dedupeStrings(lines).filter((line) => line.length >= 20).slice(0, 18);
  const sentences = dedupeStrings(
    raw
      .split(/(?<=[.!?])\s+/)
      .map((item) => cleanWhitespace(item))
      .filter((item) => item.length >= 35)
  ).slice(0, 12);

  return dedupeStrings([...highlightLines, ...sentences]).slice(0, 20);
};

const buildPreparedSourceText = (sourceText) => {
  const cleanedSource = trimSourceText(sourceText);
  const highlights = buildSourceHighlights(cleanedSource);

  if (!highlights.length) {
    return cleanedSource;
  }

  return trimSourceText(
    [
      "Key source highlights:",
      ...highlights.map((item, index) => `${index + 1}. ${item}`),
      "",
      "Full source excerpt:",
      cleanedSource,
    ].join("\n")
  );
};

const normalizeQuestion = (question) => ({
  prompt: cleanWhitespace(question?.prompt),
  options: Array.isArray(question?.options)
    ? question.options.map((option) => cleanWhitespace(option))
    : [],
  correctOptionIndex: Number(question?.correctOptionIndex),
  explanation: cleanWhitespace(question?.explanation),
});

const isWeakOption = (value = "") =>
  /all of the above|none of the above|both a and b|both b and c|not enough information/i.test(value);

const FALLBACK_PROMPT_TEMPLATES = [
  "What is the main idea emphasized most clearly in this part of the source?",
  "Which takeaway is best supported by the source material here?",
  "If a learner followed the source, which focus would fit best?",
  "Which conclusion follows most directly from the source material?",
  "Which detail is most consistent with the explanation in the source?",
];

const shouldUseFallbackQuiz = (error) =>
  getFreeModelSettings().fallbackEnabled || error?.upstreamStatus === 429;

const normalizeQuestionCount = (questionCount) => {
  const parsedQuestionCount = Number(questionCount);

  if (!Number.isInteger(parsedQuestionCount)) {
    return DEFAULT_QUESTION_COUNT;
  }

  return Math.min(Math.max(parsedQuestionCount, MIN_QUESTION_COUNT), MAX_QUESTION_COUNT);
};

const validateGeneratedQuestions = (questions, questionCount) => {
  if (!Array.isArray(questions) || questions.length !== questionCount) {
    throw new Error(`Generated quiz did not include exactly ${questionCount} questions`);
  }

  const promptSet = new Set();

  questions.forEach((rawQuestion, questionIndex) => {
    const question = normalizeQuestion(rawQuestion);

    if (question.prompt.length < MIN_QUESTION_LENGTH) {
      throw new Error(`Question ${questionIndex + 1} prompt is too short`);
    }

    if (question.explanation.length < MIN_EXPLANATION_LENGTH) {
      throw new Error(`Question ${questionIndex + 1} explanation is too short`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`Question ${questionIndex + 1} must have exactly four options`);
    }

    if (!Number.isInteger(question.correctOptionIndex) || question.correctOptionIndex < 0 || question.correctOptionIndex > 3) {
      throw new Error(`Question ${questionIndex + 1} has an invalid correct option index`);
    }

    const normalizedPrompt = question.prompt.toLowerCase();
    if (promptSet.has(normalizedPrompt)) {
      throw new Error(`Question ${questionIndex + 1} duplicates another prompt`);
    }
    promptSet.add(normalizedPrompt);

    const normalizedOptions = new Set();
    question.options.forEach((option, optionIndex) => {
      if (option.length < 3) {
        throw new Error(`Question ${questionIndex + 1} has an option that is too short`);
      }

      if (isWeakOption(option)) {
        throw new Error(`Question ${questionIndex + 1} uses a weak generic option`);
      }

      const normalizedOption = option.toLowerCase();
      if (normalizedOptions.has(normalizedOption)) {
        throw new Error(`Question ${questionIndex + 1} contains duplicate options`);
      }
      normalizedOptions.add(normalizedOption);
    });

    const correctAnswer = question.options[question.correctOptionIndex]?.toLowerCase();
    const matchingOptions = question.options.filter((option) => option.toLowerCase() === correctAnswer);
    if (matchingOptions.length !== 1) {
      throw new Error(`Question ${questionIndex + 1} does not have one distinct correct answer`);
    }
  });

  return questions.map((question) => normalizeQuestion(question));
};

const buildFallbackQuiz = (sourceText, questionCount) => {
  const targetQuestionCount = normalizeQuestionCount(questionCount);
  const sentences = buildSourceHighlights(sourceText).filter((item) => item.length > 40).slice(0, 12);

  const pool =
    sentences.length >= targetQuestionCount
      ? sentences
      : [
          ...sentences,
          "The material emphasizes core ideas, practical examples, and review checkpoints.",
          "Key terms and examples should be revisited after each section for retention.",
          "The source connects concepts to application rather than memorization alone.",
          "A strong takeaway is to combine theory with small, repeated practice loops.",
          "Important details are reinforced through examples and structured explanations.",
        ].slice(0, targetQuestionCount + 3);

  const questions = pool.slice(0, targetQuestionCount).map((sentence, index) => {
    const distractors = pool.filter((item) => item !== sentence);
    const candidateOptions = [
      sentence,
      distractors[index % distractors.length],
      distractors[(index + 1) % distractors.length],
      distractors[(index + 2) % distractors.length],
    ].filter(Boolean);
    const options = dedupeStrings(candidateOptions).slice(0, 4);

    while (options.length < 4) {
      options.push("This option is less aligned with the source material than the others.");
    }

    const correctOptionIndex = index % 4;
    const orderedOptions = [...options];
    const [correctOption] = orderedOptions.splice(0, 1);
    orderedOptions.splice(correctOptionIndex, 0, correctOption);

    return {
      prompt: FALLBACK_PROMPT_TEMPLATES[index % FALLBACK_PROMPT_TEMPLATES.length],
      options: orderedOptions,
      correctOptionIndex,
      explanation:
        "This option is the closest match to the source excerpt and reflects the idea stated there most directly.",
    };
  });

  return {
    questions,
    model: "heuristic-fallback",
    sourceExcerpt: pool.join(" ").slice(0, 1500),
  };
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.text();
};

const buildVideoSourceText = async (videoUrl) => {
  const parts = [];

  if (isYouTubeUrl(videoUrl)) {
    try {
      const oembed = await fetchJson(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
      );
      parts.push(`Video title: ${oembed.title || ""}`);
      parts.push(`Channel: ${oembed.author_name || ""}`);
    } catch (_error) {
      // Ignore and continue with page fetch fallback.
    }
  }

  try {
    const html = await fetchText(videoUrl);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descriptionMatch = html.match(
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([\s\S]*?)["']/i
    );
    const text = stripHtml(html);

    if (titleMatch?.[1]) {
      parts.push(`Page title: ${cleanWhitespace(titleMatch[1])}`);
    }

    if (descriptionMatch?.[1]) {
      parts.push(`Page description: ${cleanWhitespace(descriptionMatch[1])}`);
    }

    if (text) {
      parts.push(`Visible page text: ${text.slice(0, 7000)}`);
    }
  } catch (_error) {
    // Fall back to URL-only context.
  }

  if (!parts.length) {
    parts.push(`Video URL: ${videoUrl}`);
  }

  return trimSourceText(parts.join("\n"));
};

const buildPrompt = ({ topicSlug, questionCount, sourceType, sourceLabel, sourceText }) =>
  [
    "Create a high-quality study quiz from the provided learning material.",
    `Write exactly ${questionCount} multiple-choice questions.`,
    "Each question must have exactly four options.",
    "Only one option can be correct.",
    "Questions must be answerable from the source only.",
    "Test a mix of factual recall, concept understanding, and application of ideas from the source.",
    `Use at least ${Math.min(4, questionCount)} distinct question styles across the quiz.`,
    "Mix formats such as main idea, definition, comparison, scenario, sequence, cause and effect, or best-supported conclusion when the source allows it.",
    "Do not repeat the same question stem pattern across the whole quiz.",
    "Avoid vague wording, trivia, repeated question patterns, and generic filler.",
    "Do not use options like 'All of the above' or 'None of the above'.",
    "Make distractors plausible but clearly incorrect based on the source.",
    "Prefer specific terms, examples, steps, contrasts, or outcomes mentioned in the material.",
    "Explanations should briefly say why the answer is correct by referring to the source material.",
    `Topic slug: ${topicSlug}`,
    `Source type: ${sourceType}`,
    `Source label: ${sourceLabel || "Untitled source"}`,
    "",
    `Source material:\n${buildPreparedSourceText(sourceText)}`,
  ].join("\n");

const callFreeQuizGenerator = async ({ topicSlug, questionCount, sourceType, sourceLabel, sourceText }) => {
  const targetQuestionCount = normalizeQuestionCount(questionCount);
  const { model, data: parsed } = await callFreeModelJson({
    systemPrompt:
      "You generate rigorous multiple-choice quizzes from study material. Every question must be grounded in the source, varied in style, and written clearly enough for a learner to answer without guessing.",
    userPrompt: `${buildPrompt({ topicSlug, questionCount: targetQuestionCount, sourceType, sourceLabel, sourceText })}

Return JSON with this exact shape:
{
  "questions": [
    {
      "prompt": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0,
      "explanation": "string"
    }
  ]
}`,
    schemaName: "generated_quiz",
  });
  const questions = validateGeneratedQuestions(parsed.questions, targetQuestionCount);

  return {
    questions,
    model,
    sourceExcerpt: trimSourceText(sourceText).slice(0, 1500),
  };
};

export const buildQuizSource = async ({ sourceType, videoUrl, file }) => {
  if (sourceType === "pdf") {
    if (!file?.buffer) {
      const error = new Error("A document file is required");
      error.statusCode = 400;
      throw error;
    }

    const extracted = await extractTextFromDocument(file);

    return {
      sourceLabel: extracted.sourceLabel,
      sourceText: trimSourceText(extracted.sourceText),
    };
  }

  if (!videoUrl) {
    const error = new Error("A video URL is required");
    error.statusCode = 400;
    throw error;
  }

  return {
    sourceLabel: videoUrl,
    sourceText: await buildVideoSourceText(videoUrl),
  };
};

export const generateQuizFromSource = async ({
  topicSlug,
  questionCount = DEFAULT_QUESTION_COUNT,
  sourceType,
  sourceLabel,
  sourceText,
}) => {
  try {
    return await callFreeQuizGenerator({
      topicSlug,
      questionCount,
      sourceType,
      sourceLabel,
      sourceText,
    });
  } catch (error) {
    if (!shouldUseFallbackQuiz(error)) {
      throw error;
    }

    return buildFallbackQuiz(sourceText, questionCount);
  }
};
