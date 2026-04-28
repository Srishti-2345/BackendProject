# LearnSphere

A MERN implementation of your online learning platform idea centered on this product loop:

- Learn through courses and blogs
- Practice with challenges
- Earn topic XP and skill progression
- Unlock uploader access per topic
- Submit content for review and publish back into the community

## What this build now includes

- JWT auth with learner accounts and topic-based creator access
- Topic model with uploader unlock thresholds
- Course catalog, enrollment flow, and progress tracking
- XP ledger with lesson, course, challenge, and content approval rewards
- Challenge catalog with submission history and XP awards
- Blog publishing flow with draft and review statuses
- Course-specific and blog-specific discussion threads
- Learner dashboard with skill map, XP history, and unlocked topics
- Creator dashboard with readiness tracking, applications, pipeline status, course creation, and blog drafting
- Quiz generation from uploaded documents or video links using free-model inference
- Resume review from PDF or ODT documents using extracted text plus free-model topic matching
- Seed data for topics, courses, blogs, and challenges

## Stack

- Frontend: React, React Router, Axios, Vite
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, OpenRouter-compatible free-model API, ODT parsing
- Database: MongoDB

## Project structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    seed/
    utils/
frontend/
  src/
    api/
    components/
    context/
    pages/
```

## Core product flows covered

### Learner flow

- Browse courses, blogs, and challenges
- Enroll in a course
- Mark lessons complete
- Earn topic XP
- Solve challenges and improve topic readiness
- Participate in course and blog discussions

### Creator flow

- Build topic XP and challenge history
- Unlock uploader eligibility per topic
- Apply for creator access
- Create course drafts and blog drafts
- Track content pipeline and creator metrics

## Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in `MONGODB_URI` and `JWT_SECRET`
3. Add `OPENROUTER_API_KEY` if you want AI quiz generation and resume review enabled
4. Install dependencies

```bash
cd backend
npm install
```

5. Optional: seed demo data without deleting your existing records

```bash
npm run seed
```

To wipe the demo collections and recreate them from scratch, run:

```bash
npm run seed:reset
```

6. Start the API

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`
2. Install dependencies

```bash
cd frontend
npm install
```

3. Start the app

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Demo data notes

The seed script creates:

- sample topics
- one published course
- one published blog
- two sample challenges
- demo learner and instructor users

## Current MVP boundaries

This version is intentionally a strong MVP, not the final production platform. The following are still simplified:

- challenge execution is simulated, not sandboxed
- content review is represented by workflow states, not a full admin moderation UI
- checkout is a placeholder flow, not a real payment gateway
- media hosting and streaming are not yet integrated

## Best next upgrades

- Secure multi-language code execution sandbox
- Admin and moderator review panel
- Challenge editorial, runtime metrics, and plagiarism checks
- Topic leaderboards and recommendation engine
- Stripe or Razorpay payments
- Video uploads, transcripts, and analytics
- Notifications and email flows
