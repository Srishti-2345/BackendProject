# LearnSphere

LearnSphere is a MERN learning platform for courses, blogs, AI quiz practice, topic progress, creator unlocking, and reviewer-approved publishing.

## Core Workflow

1. A learner registers or logs in.
2. The learner browses courses and blogs.
3. The learner enrolls in a course through the demo checkout flow.
4. Lessons are completed inside the learning player.
5. Completion awards topic XP and updates the learner dashboard.
6. Topic progress can unlock creator access for that topic.
7. Unlocked users can draft courses and blogs.
8. Reviewers approve, reject, or request changes.
9. Approved content appears publicly for other learners.

## Features

### Authentication

- JWT-based registration and login.
- Google account sign-in/sign-up through Google Identity Services.
- User roles: student, instructor, and reviewer.
- Reviewer accounts are restricted to the configured reviewer email domain.
- Protected routes keep dashboards, learning pages, creator tools, and review tools behind authentication.

### Course Catalog

- Public course listing with search and topic filtering.
- Course detail pages show title, topic, instructor, price, level, outcomes, requirements, and curriculum.
- Enrolled and non-enrolled courses are visually differentiated where enrollment data is available.
- Non-enrolled learners can start the demo checkout/enrollment flow.
- Enrolled learners can continue directly to the course player.

### Enrollment And Learning

- Demo checkout creates an order and confirms enrollment.
- Enrolled courses appear on the student dashboard as compact progress cards.
- Dashboard course cards show course thumbnail, topic, instructor, progress percentage, completed lesson count, next lesson, and a continue button.
- Lesson lists are intentionally hidden on the dashboard so the page stays focused.
- The learning player supports video lessons, article lessons, lesson notes, resource links, and course discussion access.
- Marking lessons complete updates progress and awards XP.
- Completing a full course awards course-completion XP.

### Student Dashboard

- Shows current streak, total XP, and unlocked topic count.
- Shows topic skill map with level, quiz completion count, and XP.
- Shows only the five most recent XP activities.
- Shows enrolled course progress in a compact card grid.

### Topic Progress And Unlocking

- Each topic tracks learner XP, level, quiz completions, strong quiz scores, and uploader unlock status.
- Topic access is used to decide whether a learner can create courses or blogs for that topic.
- Creator access can come from topic progress, manual approval, or an OpenLearn email account.
- Resume-based topic unlocking has been removed.

### Quiz Studio

- Learners can generate quizzes from PDF/ODT documents or video URLs.
- Quiz generation uses the configured OpenRouter-compatible free-model API.
- The app validates generated quiz structure and can use fallback quiz generation when enabled.
- Quiz attempts are saved with questions, answers, score, and explanations.
- Quiz completion awards topic XP and contributes to topic readiness.

### Blogs

- Published blogs are available in the blog catalog.
- Blog detail pages focus on the article content.
- Creators can draft blogs and submit them for review.
- Reviewers moderate blog submissions before publication.

### Creator Workspace

- Shows creator metrics, contribution access, topic readiness, courses, and blog drafts.
- Creators can activate topic access after meeting topic requirements.
- Course creation supports title, subtitle, description, category, topic, level, thumbnail, price, outcomes, requirements, and initial lesson content.
- Blog creation supports title, excerpt, content, topic, draft status, and review submission.
- Existing courses and blogs can be edited from the workspace.

### Review Dashboard

- Reviewer users can view pending course and blog submissions.
- Reviewers can inspect submission details.
- Reviewers can approve, reject, or request changes with notes.
- Creator dashboards show review status and feedback.

### Discussions

- Course discussions are available for course-related learning flows.
- Learners can create threads and replies.
- Helpful discussion activity can award XP.
- Blog discussions are not shown on the blog page.

## Stack

- Frontend: React, React Router, Axios, Vite
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- AI integration: OpenRouter-compatible chat completions for quiz generation
- Document support: PDF/ODT text extraction for quiz source material

## Project Structure

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

## Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Fill in `MONGODB_URI` and `JWT_SECRET`.
3. Add `OPENROUTER_API_KEY` if AI quiz generation should be enabled.
4. Install dependencies.

```bash
cd backend
npm install
```

5. Optionally seed demo data.

```bash
npm run seed
```

To reset demo collections and recreate them:

```bash
npm run seed:reset
```

6. Start the backend.

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install dependencies.

```bash
cd frontend
npm install
```

3. Start the frontend.

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Demo Data

The seed script creates sample topics, published courses, published blogs, and demo users for learner, instructor, and reviewer workflows.

## MVP Boundaries

- Checkout is a placeholder flow, not a real payment gateway.
- Media hosting is URL-based; video upload/storage is not implemented.
- Review moderation is workflow-based, not a full admin suite.
- AI quiz generation depends on the configured OpenRouter key and model availability.
