import dotenv from "dotenv";

import connectDatabase from "../config/db.js";
import BlogPost from "../models/BlogPost.js";
import Challenge from "../models/Challenge.js";
import CreatorApplication from "../models/CreatorApplication.js";
import Course from "../models/Course.js";
import DiscussionThread from "../models/DiscussionThread.js";
import Topic from "../models/Topic.js";
import User from "../models/User.js";

dotenv.config();

const runSeed = async () => {
  await connectDatabase();

  await Course.deleteMany();
  await BlogPost.deleteMany();
  await Challenge.deleteMany();
  await CreatorApplication.deleteMany();
  await DiscussionThread.deleteMany();
  await Topic.deleteMany();
  await User.deleteMany();

  const instructor = await User.create({
    name: "Demo Instructor",
    email: "instructor@example.com",
    password: "password123",
    role: "instructor",
    bio: "Teaches practical web development and product skills.",
    creatorReputation: 180,
    topicStats: [
      {
        topicSlug: "react",
        xp: 1200,
        level: 3,
        challengeSolvedCount: 6,
        mediumSolvedCount: 2,
        uploaderUnlocked: true,
      },
    ],
  });

  const student = await User.create({
    name: "Demo Student",
    email: "student@example.com",
    password: "password123",
    role: "student",
  });

  await Topic.insertMany([
    {
      name: "React",
      slug: "react",
      description: "Component architecture, state management, and frontend workflows.",
      category: "Web Development",
      uploaderRequirements: {
        xpThreshold: 600,
        challengeSolvedThreshold: 2,
        mediumSolvedThreshold: 1,
      },
    },
    {
      name: "Data Structures",
      slug: "data-structures",
      description: "Arrays, strings, maps, and problem-solving patterns.",
      category: "Programming",
      uploaderRequirements: {
        xpThreshold: 800,
        challengeSolvedThreshold: 3,
        mediumSolvedThreshold: 1,
      },
    },
  ]);

  await Course.create({
    title: "MERN Bootcamp for Beginners",
    slug: "mern-bootcamp-for-beginners",
    subtitle: "Build and deploy full-stack projects from scratch",
    description:
      "Learn MongoDB, Express, React, and Node by building a complete production-ready application.",
    category: "Web Development",
    topicSlug: "react",
    level: "beginner",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    price: 1999,
    learningOutcomes: [
      "Understand the MERN architecture",
      "Build REST APIs with Express",
      "Manage React state and routing",
      "Model data effectively with MongoDB",
    ],
    requirements: ["Basic JavaScript", "A laptop with Node.js installed"],
    sections: [
      {
        title: "Getting Started",
        lessons: [
          { title: "Course Introduction", duration: "08:30", isPreview: true },
          { title: "Setting Up the Development Environment", duration: "14:00" },
        ],
      },
      {
        title: "Backend Foundations",
        lessons: [
          { title: "Express Project Setup", duration: "12:15" },
          { title: "MongoDB Models and Relationships", duration: "18:40" },
        ],
      },
    ],
    instructor: instructor._id,
    status: "published",
  });

  await BlogPost.create({
    title: "How to structure your first React learning sprint",
    slug: "how-to-structure-your-first-react-learning-sprint",
    excerpt: "A practical weekly workflow for new React learners.",
    content:
      "Break your learning into lessons, recap quizzes, and one challenge per day. Track your XP and use community threads for blockers.",
    topicSlug: "react",
    author: instructor._id,
    status: "published",
  });

  await CreatorApplication.create({
    applicant: instructor._id,
    topicSlug: "react",
    requestedLevel: 2,
    statement: "I have already taught React fundamentals and want to contribute.",
    status: "approved",
    reviewerNotes: "Approved in seed data for demo access.",
  });

  await Challenge.insertMany([
    {
      title: "Two Sum Pattern Warmup",
      slug: "two-sum-pattern-warmup",
      topicSlug: "data-structures",
      difficulty: "easy",
      prompt: "Return indices of two numbers that add up to the target.",
      constraints: ["2 <= nums.length <= 10^4", "Exactly one valid answer"],
      examples: ["nums = [2,7,11,15], target = 9 -> [0,1]"],
      xpReward: 100,
      tags: ["arrays", "hashmap"],
      functionName: "solution",
      starterCode:
        "function solution(nums, target) {\n  // return the two indices\n}\n\nmodule.exports = solution;",
      publicTestCases: [
        {
          input: [[2, 7, 11, 15], 9],
          expectedOutput: [0, 1],
          explanation: "2 + 7 = 9",
        },
        {
          input: [[3, 2, 4], 6],
          expectedOutput: [1, 2],
          explanation: "2 + 4 = 6",
        },
      ],
      hiddenTestCases: [
        {
          input: [[3, 3], 6],
          expectedOutput: [0, 1],
        },
      ],
      editorial: "Use a hash map to store visited values and their indices.",
    },
    {
      title: "React State Synchronization",
      slug: "react-state-synchronization",
      topicSlug: "react",
      difficulty: "medium",
      prompt: "Design a component state flow for a nested lesson progress tracker.",
      constraints: ["Support optimistic updates", "Preserve server truth on refresh"],
      examples: ["Track module, lesson, and completion percentage updates"],
      xpReward: 180,
      tags: ["react", "state-management"],
      functionName: "solution",
      starterCode:
        "function solution(state, update) {\n  // return the next state snapshot\n}\n\nmodule.exports = solution;",
      publicTestCases: [
        {
          input: [
            { completedLessons: 3, totalLessons: 10 },
            { delta: 2 },
          ],
          expectedOutput: { completedLessons: 5, totalLessons: 10, completionPercentage: 50 },
          explanation: "Apply the lesson delta and recalculate completion percentage.",
        },
      ],
      hiddenTestCases: [
        {
          input: [
            { completedLessons: 5, totalLessons: 8 },
            { delta: 1 },
          ],
          expectedOutput: { completedLessons: 6, totalLessons: 8, completionPercentage: 75 },
        },
      ],
      editorial: "Normalize state shape and reconcile writes after async responses.",
    },
  ]);

  console.log("Seed complete");
  console.log("Instructor:", instructor.email);
  console.log("Student:", student.email);
  process.exit(0);
};

runSeed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
