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

const shouldResetDatabase = process.argv.includes("--reset");

const upsertDocument = async (Model, filter, update) =>
  Model.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

const createOrUpdateUser = async ({ email, password, ...fields }) => {
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    return User.create({
      email,
      password,
      ...fields,
    });
  }

  existingUser.set({
    email,
    ...fields,
  });

  if (password) {
    existingUser.password = password;
  }

  await existingUser.save();
  return existingUser;
};

const runSeed = async () => {
  await connectDatabase();

  if (shouldResetDatabase) {
    await Course.deleteMany();
    await BlogPost.deleteMany();
    await Challenge.deleteMany();
    await CreatorApplication.deleteMany();
    await DiscussionThread.deleteMany();
    await Topic.deleteMany();
    await User.deleteMany();
  }

  const instructor = await createOrUpdateUser({
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

  const student = await createOrUpdateUser({
    name: "Demo Student",
    email: "student@example.com",
    password: "password123",
    role: "student",
  });

  await upsertDocument(
    Topic,
    { slug: "react" },
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
    }
  );

  await upsertDocument(
    Topic,
    { slug: "data-structures" },
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
    }
  );

  await upsertDocument(
    Course,
    { slug: "mern-bootcamp-for-beginners" },
    {
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
            {
              title: "Course Introduction",
              duration: "08:30",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
              resources: ["https://react.dev/learn"],
              isPreview: true,
            },
            {
              title: "Setting Up the Development Environment",
              duration: "14:00",
              contentType: "article",
              articleBody:
                "# Setup your MERN workspace\n\nYou are going to run two apps:\n- `backend` (Express + MongoDB)\n- `frontend` (React + Vite)\n\n## Checklist\n- Node.js 18+\n- MongoDB running (local or Atlas)\n- A code editor\n\n## Steps\n1. Create a folder for your project\n2. Initialize `backend` and `frontend`\n3. Add environment variables\n4. Start the API and the client\n\n## Sanity check\nWhen everything works:\n- API health endpoint returns JSON\n- Frontend loads and can login\n",
              articleUrl: "https://nodejs.org/en/download",
              resources: ["https://nodejs.org/en/download", "https://www.mongodb.com/try/download/community"],
            },
          ],
        },
        {
          title: "Backend Foundations",
          lessons: [
            {
              title: "Express Project Setup",
              duration: "12:15",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=Oe421EPjeBE",
              resources: ["https://expressjs.com/"],
            },
            {
              title: "MongoDB Models and Relationships",
              duration: "18:40",
              contentType: "article",
              articleBody:
                "# Modeling your learning platform\n\nA clean data model keeps your product fast and maintainable.\n\n## Core entities\n- Users\n- Topics\n- Courses\n- Enrollments\n- XP events\n\n## Practical tips\n- Prefer references for relationships and populate only where needed\n- Add indexes for unique constraints and common lookups\n- Keep write paths simple (award XP via an event ledger)\n\n## Next\nTry adding one more field to a lesson:\n- `resources` for links and PDFs\n",
              articleUrl: "https://mongoosejs.com/docs/models.html",
              resources: ["https://mongoosejs.com/docs/models.html", "https://mongoosejs.com/docs/populate.html"],
            },
            {
              title: "Build Your First API Route",
              duration: "11:10",
              contentType: "article",
              articleBody:
                "# Your first API route\n\nYou will build a minimal route and validate it end to end.\n\n## Goal\n- Add a route: `GET /api/health`\n- Return `{ success: true }`\n\n## Why it matters\nThis confirms your server, middleware, and JSON responses are correct before you add auth.\n\n## Next\nAdd a `POST /api/auth/register` endpoint and test it from the frontend.\n",
              resources: ["https://expressjs.com/en/guide/routing.html"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
    }
  );

  await upsertDocument(
    BlogPost,
    { slug: "how-to-structure-your-first-react-learning-sprint" },
    {
      title: "How to structure your first React learning sprint",
      slug: "how-to-structure-your-first-react-learning-sprint",
      excerpt: "A practical weekly workflow for new React learners.",
      content:
        "Break your learning into lessons, recap quizzes, and one challenge per day. Track your XP and use community threads for blockers.",
      topicSlug: "react",
      author: instructor._id,
      status: "published",
    }
  );

  await upsertDocument(
    CreatorApplication,
    { applicant: instructor._id, topicSlug: "react" },
    {
      applicant: instructor._id,
      topicSlug: "react",
      requestedLevel: 2,
      statement: "I have already taught React fundamentals and want to contribute.",
      status: "approved",
      reviewerNotes: "Approved in seed data for demo access.",
    }
  );

  await upsertDocument(
    Challenge,
    { slug: "two-sum-pattern-warmup" },
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
    }
  );

  await upsertDocument(
    Challenge,
    { slug: "react-state-synchronization" },
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
    }
  );

  console.log(shouldResetDatabase ? "Seed complete with reset" : "Seed complete without deleting existing data");
  console.log("Instructor:", instructor.email);
  console.log("Student:", student.email);
  process.exit(0);
};

runSeed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
