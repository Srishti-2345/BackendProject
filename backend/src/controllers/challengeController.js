import Challenge from "../models/Challenge.js";
import Submission from "../models/Submission.js";
import { runChallengeTests } from "../utils/challengeRunner.js";
import { awardXp, getTopicStat } from "../utils/progression.js";

const challengeXpByDifficulty = {
  easy: 100,
  medium: 180,
  hard: 300,
};

export const getChallenges = async (req, res, next) => {
  try {
    const { topic = "", difficulty = "" } = req.query;
    const query = {};

    if (topic) {
      query.topicSlug = topic;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const challenges = await Challenge.find(query).sort({ createdAt: -1 });
    res.json({ success: true, challenges });
  } catch (error) {
    next(error);
  }
};

export const getChallengeBySlug = async (req, res, next) => {
  try {
    const challenge = await Challenge.findOne({ slug: req.params.slug });
    if (!challenge) {
      const error = new Error("Challenge not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
};

export const getMyChallengeSubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({
      challenge: req.params.challengeId,
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

export const runChallengeCode = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      const error = new Error("Challenge not found");
      error.statusCode = 404;
      throw error;
    }

    const { code = "" } = req.body;
    if (!code.trim()) {
      const error = new Error("Code is required");
      error.statusCode = 400;
      throw error;
    }

    const execution = runChallengeTests({
      code,
      functionName: challenge.functionName,
      testCases: challenge.publicTestCases,
    });

    res.json({
      success: true,
      mode: "run",
      execution,
    });
  } catch (error) {
    next(error);
  }
};

export const submitChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId).select("+hiddenTestCases");
    if (!challenge) {
      const error = new Error("Challenge not found");
      error.statusCode = 404;
      throw error;
    }

    const { language = "javascript", code = "" } = req.body;
    if (language !== "javascript") {
      const error = new Error("This MVP currently supports JavaScript submissions only");
      error.statusCode = 400;
      throw error;
    }

    if (!code.trim()) {
      const error = new Error("Code is required");
      error.statusCode = 400;
      throw error;
    }

    const execution = runChallengeTests({
      code,
      functionName: challenge.functionName,
      testCases: [...challenge.publicTestCases, ...challenge.hiddenTestCases],
    });
    const result = execution.passed ? "accepted" : "wrong_answer";

    const publicCount = challenge.publicTestCases.length;
    const publicResults = execution.results.slice(0, publicCount);
    const hiddenResults = execution.results.slice(publicCount);
    const hiddenSummary = {
      total: hiddenResults.length,
      passed: hiddenResults.filter((item) => item.passed).length,
    };

    const submission = await Submission.create({
      challenge: challenge._id,
      user: req.user._id,
      language,
      code,
      result,
      score: result === "accepted" ? 100 : 20,
    });

    let xpAwarded = 0;
    if (result === "accepted") {
      const previousAccepted = await Submission.findOne({
        challenge: challenge._id,
        user: req.user._id,
        result: "accepted",
        _id: { $ne: submission._id },
      });

      if (!previousAccepted) {
        const stat = getTopicStat(req.user, challenge.topicSlug);
        stat.challengeSolvedCount += 1;
        if (challenge.difficulty === "medium" || challenge.difficulty === "hard") {
          stat.mediumSolvedCount += 1;
        }

        xpAwarded = challengeXpByDifficulty[challenge.difficulty] || challenge.xpReward;
        await awardXp({
          user: req.user,
          topicSlug: challenge.topicSlug,
          xp: xpAwarded,
          sourceType: "challenge_solved",
          metadata: { challengeId: challenge._id, difficulty: challenge.difficulty },
        });

        challenge.solveCount += 1;
        await challenge.save();
      }
    }

    res.status(201).json({
      success: true,
      submission,
      xpAwarded,
      execution: {
        passed: execution.passed,
        results: publicResults,
      },
      hiddenSummary,
      hiddenResults: execution.passed ? hiddenResults : [],
    });
  } catch (error) {
    next(error);
  }
};
