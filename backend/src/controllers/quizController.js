import QuizAttempt from "../models/QuizAttempt.js";
import { awardXp, getTopicStat } from "../utils/progression.js";
import { buildQuizSource, generateQuizFromSource } from "../utils/quizGenerator.js";

const sanitizeAttempt = (attempt) => ({
  id: attempt._id,
  topicSlug: attempt.topicSlug,
  sourceType: attempt.sourceType,
  sourceLabel: attempt.sourceLabel,
  videoUrl: attempt.videoUrl,
  sourceExcerpt: attempt.sourceExcerpt,
  generatedByModel: attempt.generatedByModel,
  createdAt: attempt.createdAt,
  questions: attempt.questions.map((question, index) => ({
    index,
    prompt: question.prompt,
    options: question.options,
  })),
  result: attempt.result,
});

export const generateQuiz = async (req, res, next) => {
  try {
    const { sourceType, topicSlug, videoUrl = "" } = req.body;

    if (!sourceType || !topicSlug) {
      const error = new Error("Source type and topic are required");
      error.statusCode = 400;
      throw error;
    }

    if (!["pdf", "video_url"].includes(sourceType)) {
      const error = new Error("Unsupported source type");
      error.statusCode = 400;
      throw error;
    }

    const { sourceLabel, sourceText } = await buildQuizSource({
      sourceType,
      videoUrl,
      file: req.file,
    });

    const generatedQuiz = await generateQuizFromSource({
      topicSlug,
      sourceType,
      sourceLabel,
      sourceText,
    });

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      topicSlug,
      sourceType,
      sourceLabel,
      videoUrl,
      sourceExcerpt: generatedQuiz.sourceExcerpt,
      generatedByModel: generatedQuiz.model,
      questions: generatedQuiz.questions,
    });

    res.status(201).json({
      success: true,
      attempt: sanitizeAttempt(attempt),
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizHistory = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(12);
    res.json({
      success: true,
      attempts: attempts.map((attempt) => sanitizeAttempt(attempt)),
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { answers = [] } = req.body;
    const attempt = await QuizAttempt.findOne({
      _id: req.params.attemptId,
      user: req.user._id,
    });

    if (!attempt) {
      const error = new Error("Quiz attempt not found");
      error.statusCode = 404;
      throw error;
    }

    if (!Array.isArray(answers) || answers.length !== attempt.questions.length) {
      const error = new Error("Please answer every quiz question");
      error.statusCode = 400;
      throw error;
    }

    const questionResults = attempt.questions.map((question, index) => {
      const selectedOptionIndex = Number(answers[index]);
      const correct = selectedOptionIndex === question.correctOptionIndex;

      return {
        prompt: question.prompt,
        options: question.options,
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        selectedOption:
          selectedOptionIndex >= 0 ? question.options[selectedOptionIndex] || "" : "",
        correctOption: question.options[question.correctOptionIndex] || "",
        explanation: question.explanation,
        correct,
      };
    });

    const score = questionResults.filter((item) => item.correct).length;
    attempt.result = {
      score,
      totalQuestions: attempt.questions.length,
      answers: answers.map((item) => Number(item)),
      submittedAt: new Date(),
    };
    await attempt.save();

    const stat = getTopicStat(req.user, attempt.topicSlug);
    stat.quizCompletedCount += 1;
    if (score >= Math.ceil(attempt.questions.length * 0.8)) {
      stat.masteredQuizCount += 1;
    }

    await awardXp({
      user: req.user,
      topicSlug: attempt.topicSlug,
      xp: score * 15,
      sourceType: "quiz_completed",
      metadata: {
        attemptId: attempt._id,
        sourceType: attempt.sourceType,
      },
    });

    res.json({
      success: true,
      result: {
        score,
        totalQuestions: attempt.questions.length,
        percentage: Math.round((score / attempt.questions.length) * 100),
        questionResults,
      },
    });
  } catch (error) {
    next(error);
  }
};
