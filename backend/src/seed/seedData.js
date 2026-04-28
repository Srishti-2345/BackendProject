import dotenv from "dotenv";

import connectDatabase from "../config/db.js";
import BlogPost from "../models/BlogPost.js";
import CreatorApplication from "../models/CreatorApplication.js";
import Course from "../models/Course.js";
import DiscussionThread from "../models/DiscussionThread.js";
import QuizAttempt from "../models/QuizAttempt.js";
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
    await QuizAttempt.deleteMany();
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
        quizCompletedCount: 6,
        masteredQuizCount: 2,
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

  const reviewer = await createOrUpdateUser({
    name: "Demo Reviewer",
    email: "reviewer@chitkara.edu.in",
    password: "password123",
    role: "reviewer",
    bio: "Reviews community submissions before they reach learners.",
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
        quizCompletedThreshold: 2,
        masteredQuizThreshold: 1,
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
        quizCompletedThreshold: 3,
        masteredQuizThreshold: 1,
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
    Course,
    { slug: "react-state-patterns-crash-course" },
    {
      title: "React State Patterns Crash Course",
      slug: "react-state-patterns-crash-course",
      subtitle: "Practice local state, derived state, and async UI flows",
      description:
        "A short practical course for testing topic pages, course browsing, and lesson rendering with a React-focused curriculum.",
      category: "React",
      topicSlug: "react",
      level: "beginner",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      price: 799,
      learningOutcomes: [
        "Understand when to keep state local",
        "Model loading, success, and error states",
        "Build small reusable UI state patterns",
      ],
      requirements: ["Basic React components", "Comfort with JavaScript arrays and objects"],
      sections: [
        {
          title: "State Basics",
          lessons: [
            {
              title: "Thinking in UI States",
              duration: "09:20",
              contentType: "article",
              articleBody:
                "# Thinking in UI states\n\nEvery screen usually has four core states:\n- idle\n- loading\n- empty\n- success\n\nWhen you model these early, components stay predictable and easier to debug.\n\n## Practice\nSketch one component and list how it should behave in each state.\n",
              articleUrl: "https://react.dev/learn/state-a-components-memory",
              resources: [
                "https://react.dev/learn/state-a-components-memory",
                "https://react.dev/learn/conditional-rendering",
              ],
              isPreview: true,
            },
            {
              title: "Fetch Data Without UI Confusion",
              duration: "13:10",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=hQAHSlTtcmY",
              resources: ["https://react.dev/reference/react/useEffect"],
            },
          ],
        },
        {
          title: "Small Real Features",
          lessons: [
            {
              title: "Build a Searchable Resource List",
              duration: "10:45",
              contentType: "article",
              articleBody:
                "# Build a searchable resource list\n\nUse one source array and derive the visible rows from the search query.\n\n## Rules\n- Keep the source data immutable\n- Derive filtered results during render\n- Reset selection when the filter removes the current item\n\n## Result\nYou get a simple but reliable interaction pattern for dashboards and content browsers.\n",
              articleUrl: "https://react.dev/learn/rendering-lists",
              resources: ["https://react.dev/learn/rendering-lists"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
      enrolledCount: 12,
    }
  );

  await upsertDocument(
    Course,
    { slug: "react-router-and-dashboard-patterns" },
    {
      title: "React Router and Dashboard Patterns",
      slug: "react-router-and-dashboard-patterns",
      subtitle: "Build cleaner navigation, nested layouts, and work-focused app flows",
      description:
        "Learn how to structure dashboards with React Router, persistent shells, protected routes, and efficient view transitions.",
      category: "Web Development",
      topicSlug: "react",
      level: "intermediate",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      price: 1299,
      learningOutcomes: [
        "Design dashboard-friendly route structures",
        "Handle protected and role-based navigation flows",
        "Create reusable page shells and nested layouts",
        "Improve UX with clearer information hierarchy",
      ],
      requirements: ["Comfort with React components", "Basic knowledge of React Router"],
      sections: [
        {
          title: "Routing Foundations",
          lessons: [
            {
              title: "Designing Routes for Real Apps",
              duration: "10:20",
              contentType: "article",
              articleBody:
                "# Design routes around workflows\n\nA route tree should reflect how users move through the product.\n\n## Start here\n- public catalog pages\n- authenticated work areas\n- detail pages with stable URLs\n\n## Rule of thumb\nIf a user needs to bookmark it, give it a route.\n",
              articleUrl: "https://reactrouter.com/en/main/start/overview",
              resources: ["https://reactrouter.com/en/main/start/overview"],
              isPreview: true,
            },
            {
              title: "Protected Routes Without Tangled Logic",
              duration: "12:35",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=Law7wfdg_ls",
              resources: ["https://reactrouter.com/en/main/route/route"],
            },
          ],
        },
        {
          title: "Dashboard UX",
          lessons: [
            {
              title: "Persistent Shells and Nested Layouts",
              duration: "15:10",
              contentType: "article",
              articleBody:
                "# Persistent shells keep users oriented\n\nA dashboard should not feel like a stack of disconnected pages.\n\n## Use nested layouts for\n- shared navigation\n- stable sidebars\n- consistent page spacing\n\n## Result\nUsers can move faster because the app keeps its shape.\n",
              articleUrl: "https://reactrouter.com/en/main/components/outlet",
              resources: ["https://reactrouter.com/en/main/components/outlet"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
      enrolledCount: 21,
    }
  );

  await upsertDocument(
    Course,
    { slug: "frontend-debugging-workflows-with-react" },
    {
      title: "Frontend Debugging Workflows with React",
      slug: "frontend-debugging-workflows-with-react",
      subtitle: "Trace rendering bugs, state mistakes, and effect issues with confidence",
      description:
        "A practical debugging course for learners who can build components but still get stuck on state, rendering, and side effects.",
      category: "Web Development",
      topicSlug: "react",
      level: "intermediate",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=80",
      price: 999,
      learningOutcomes: [
        "Find UI bugs by isolating component state",
        "Reason about effect dependencies more clearly",
        "Use logs and small test cases to narrow failures",
        "Build a repeatable debugging checklist",
      ],
      requirements: ["Basic React experience", "Familiarity with props and state"],
      sections: [
        {
          title: "Debugging Basics",
          lessons: [
            {
              title: "Shrink the Problem First",
              duration: "08:50",
              contentType: "article",
              articleBody:
                "# Shrink the problem first\n\nWhen a screen feels broken, start by reducing the surface area.\n\n## Ask\n- Which component owns the bad state?\n- What is the smallest failing interaction?\n- Can I reproduce it with hardcoded data?\n",
              articleUrl: "https://react.dev/learn/react-developer-tools",
              resources: ["https://react.dev/learn/react-developer-tools"],
              isPreview: true,
            },
            {
              title: "Reading Effects Without Guessing",
              duration: "11:40",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=0ZJgIjIuY7U",
              resources: ["https://react.dev/reference/react/useEffect"],
            },
          ],
        },
        {
          title: "A Reliable Process",
          lessons: [
            {
              title: "Create a Debugging Checklist",
              duration: "13:25",
              contentType: "article",
              articleBody:
                "# A debugging checklist you can reuse\n\n## Check in order\n- props shape\n- initial state\n- event handlers\n- async request timing\n- render conditions\n\nThis reduces panic and helps you debug with evidence instead of intuition.\n",
              resources: ["https://react.dev/learn/conditional-rendering"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
      enrolledCount: 17,
    }
  );

  await upsertDocument(
    Course,
    { slug: "data-structures-patterns-for-coding-interviews" },
    {
      title: "Data Structures Patterns for Coding Interviews",
      slug: "data-structures-patterns-for-coding-interviews",
      subtitle: "Master arrays, maps, stacks, and pattern recognition under pressure",
      description:
        "Build confidence with the most common interview data structure patterns through guided explanations and short focused practice.",
      category: "Programming",
      topicSlug: "data-structures",
      level: "intermediate",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80",
      price: 1499,
      learningOutcomes: [
        "Recognize common interview problem patterns",
        "Use hash maps and frequency tables effectively",
        "Apply stack and queue logic with confidence",
        "Choose the right structure faster during practice",
      ],
      requirements: ["Comfort with basic JavaScript", "Interest in interview preparation"],
      sections: [
        {
          title: "Core Patterns",
          lessons: [
            {
              title: "Frequency Counting with Hash Maps",
              duration: "14:15",
              contentType: "article",
              articleBody:
                "# Frequency counting\n\nHash maps become powerful when you use them to summarize input quickly.\n\n## Common use cases\n- duplicates\n- anagrams\n- pair counting\n- last seen index\n\n## Goal\nReduce repeated scanning and make comparisons constant-time where possible.\n",
              articleUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map",
              resources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map"],
              isPreview: true,
            },
            {
              title: "Stack Problems Without Memorizing Tricks",
              duration: "12:45",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=wjI1WNcIntg",
              resources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push"],
            },
          ],
        },
        {
          title: "Interview Practice",
          lessons: [
            {
              title: "How to Explain Tradeoffs Clearly",
              duration: "09:30",
              contentType: "article",
              articleBody:
                "# Explain your choice, not just your answer\n\nIn interviews, clarity matters as much as correctness.\n\n## Cover these points\n- chosen structure\n- time complexity\n- space cost\n- why alternatives were weaker\n",
              resources: ["https://bigocheatsheet.com/"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
      enrolledCount: 28,
    }
  );

  await upsertDocument(
    Course,
    { slug: "problem-solving-with-arrays-and-two-pointers" },
    {
      title: "Problem Solving with Arrays and Two Pointers",
      slug: "problem-solving-with-arrays-and-two-pointers",
      subtitle: "Build speed on the most common array interview patterns",
      description:
        "A focused course on arrays, sliding windows, and two-pointer thinking for learners building algorithm fluency.",
      category: "Programming",
      topicSlug: "data-structures",
      level: "beginner",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
      price: 899,
      learningOutcomes: [
        "Use two pointers to reduce brute-force solutions",
        "Recognize sliding window opportunities",
        "Track subarrays and ranges more confidently",
      ],
      requirements: ["Basic loops and conditionals", "Comfort reading arrays"],
      sections: [
        {
          title: "Array Thinking",
          lessons: [
            {
              title: "When Arrays Become Pattern Problems",
              duration: "07:55",
              contentType: "article",
              articleBody:
                "# Arrays are often about movement\n\nMany array questions become easier when you track positions instead of values alone.\n\n## Watch for\n- left and right boundaries\n- sorted order\n- running totals\n- window size\n",
              isPreview: true,
              resources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array"],
            },
            {
              title: "Sliding Window in Practice",
              duration: "10:30",
              contentType: "video",
              videoUrl: "https://www.youtube.com/watch?v=MK-NZ4hN7rs",
              resources: ["https://leetcode.com/tag/sliding-window/"],
            },
          ],
        },
        {
          title: "Patterns You Reuse",
          lessons: [
            {
              title: "Two Pointers for Pair and Range Problems",
              duration: "12:10",
              contentType: "article",
              articleBody:
                "# Two pointers\n\nThis pattern works best when the array is sorted or when you are expanding and shrinking a range.\n\n## Benefits\n- fewer nested loops\n- easier complexity analysis\n- cleaner reasoning about invariants\n",
              resources: ["https://leetcode.com/tag/two-pointers/"],
            },
          ],
        },
      ],
      instructor: instructor._id,
      status: "published",
      enrolledCount: 14,
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
        "Break your learning into lessons, recap quizzes, and one focused review session per day. Track your XP and use community threads for blockers.",
      topicSlug: "react",
      author: instructor._id,
      status: "published",
    }
  );

  await upsertDocument(
    BlogPost,
    { slug: "react-debugging-checklist-for-beginners" },
    {
      title: "React debugging checklist for beginners",
      slug: "react-debugging-checklist-for-beginners",
      excerpt: "A quick checklist for props, state, effects, and rendering issues.",
      content:
        "Start with the smallest failing component. Check incoming props, log state transitions, verify effect dependencies, and confirm the UI matches the current data shape. This seed article is here to help test blog listing and detail pages with more realistic content.",
      topicSlug: "react",
      author: instructor._id,
      status: "published",
      engagement: {
        views: 18,
        likes: 4,
      },
    }
  );

  await upsertDocument(
    BlogPost,
    { slug: "study-notes-for-data-structures-interviews" },
    {
      title: "Study notes for data structures interviews",
      slug: "study-notes-for-data-structures-interviews",
      excerpt: "A compact review plan for arrays, hash maps, stacks, and queues.",
      content:
        "Focus on one pattern at a time. For arrays, practice indexing and sliding window problems. For maps, track frequency counts and last-seen positions. For stacks and queues, rehearse how order changes problem design. This seeded article gives you another published post to verify filters and navigation.",
      topicSlug: "data-structures",
      author: instructor._id,
      status: "published",
      engagement: {
        views: 9,
        likes: 2,
      },
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

  console.log(shouldResetDatabase ? "Seed complete with reset" : "Seed complete without deleting existing data");
  console.log("Instructor:", instructor.email);
  console.log("Student:", student.email);
  console.log("Reviewer:", reviewer.email);
  process.exit(0);
};

runSeed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
