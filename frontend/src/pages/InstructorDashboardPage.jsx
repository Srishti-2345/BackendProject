import { useEffect, useState } from "react";

import api from "../api/client.js";

const initialForm = {
  title: "",
  subtitle: "",
  description: "",
  category: "Web Development",
  topicSlug: "react",
  level: "beginner",
  thumbnailUrl: "",
  price: 0,
  learningOutcomes: "",
  requirements: "",
  status: "draft",
};

const initialBlogForm = {
  title: "",
  excerpt: "",
  content: "",
  topicSlug: "react",
  status: "draft",
};

const InstructorDashboardPage = () => {
  const [formData, setFormData] = useState(initialForm);
  const [blogForm, setBlogForm] = useState(initialBlogForm);
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [creatorDashboard, setCreatorDashboard] = useState(null);
  const [readiness, setReadiness] = useState([]);
  const [topics, setTopics] = useState([]);
  const [message, setMessage] = useState("");

  const loadInstructorData = async () => {
    const [
      coursesResponse,
      analyticsResponse,
      creatorDashboardResponse,
      readinessResponse,
      topicsResponse,
      blogsResponse,
    ] = await Promise.all([
      api.get("/courses/instructor/me"),
      api.get("/courses/instructor/analytics"),
      api.get("/creator/dashboard"),
      api.get("/creator/readiness"),
      api.get("/topics"),
      api.get("/blogs/me"),
    ]);

    setCourses(coursesResponse.data.courses);
    setAnalytics(analyticsResponse.data.analytics);
    setCreatorDashboard(creatorDashboardResponse.data);
    setReadiness(readinessResponse.data.readiness);
    setTopics(topicsResponse.data.topics);
    setBlogs(blogsResponse.data.blogs);
  };

  useEffect(() => {
    loadInstructorData().catch((error) => console.error(error));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/courses", {
        ...formData,
        price: Number(formData.price),
        learningOutcomes: formData.learningOutcomes
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        requirements: formData.requirements
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        sections: [
          {
            title: "Introduction",
            lessons: [
              {
                title: "Welcome to the course",
                duration: "05:00",
                isPreview: true,
              },
            ],
          },
        ],
      });

      setMessage("Course created successfully.");
      setFormData(initialForm);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create course");
    }
  };

  const handleBlogSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/blogs", blogForm);
      setMessage("Blog draft submitted.");
      setBlogForm(initialBlogForm);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create blog draft");
    }
  };

  const applyForTopic = async (topicSlug) => {
    try {
      await api.post("/creator/applications", {
        topicSlug,
        requestedLevel: 1,
        statement: "I have completed the learning path and want to contribute useful content.",
      });
      setMessage(`Creator application sent for ${topicSlug}.`);
      await loadInstructorData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not apply for creator access");
    }
  };

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Creator workspace</span>
          <h2>Manage your uploader journey</h2>
        </div>
      </div>

      {analytics && creatorDashboard ? (
        <div className="stats-grid">
          <div className="metric-card">
            <strong>{analytics.totalCourses}</strong>
            <span>Courses</span>
          </div>
          <div className="metric-card">
            <strong>{analytics.totalEnrollments}</strong>
            <span>Enrollments</span>
          </div>
          <div className="metric-card">
            <strong>Rs. {analytics.totalRevenue}</strong>
            <span>Revenue</span>
          </div>
          <div className="metric-card">
            <strong>{creatorDashboard.creatorPerformance.creatorReputation}</strong>
            <span>Creator reputation</span>
          </div>
        </div>
      ) : null}

      <div className="panel">
        <h3>Topic unlock readiness</h3>
        <div className="list-stack">
          {readiness.map((item) => (
            <div key={item.topic.slug} className="list-item">
              <div>
                <strong>{item.topic.name}</strong>
                <p>
                  {item.stat.xp}/{item.topic.uploaderRequirements.xpThreshold} XP -
                  {item.stat.challengeSolvedCount}/
                  {item.topic.uploaderRequirements.challengeSolvedThreshold} solved
                </p>
              </div>
              {item.application ? (
                <span className="badge">{item.application.status}</span>
              ) : item.meetsRequirements ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => applyForTopic(item.topic.slug)}
                >
                  Apply
                </button>
              ) : (
                <span className="badge">Locked</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <form className="panel" onSubmit={handleSubmit}>
          <h3>Create a course</h3>
          <input
            placeholder="Course title"
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
          />
          <input
            placeholder="Subtitle"
            value={formData.subtitle}
            onChange={(event) => setFormData({ ...formData, subtitle: event.target.value })}
          />
          <textarea
            placeholder="Description"
            rows="5"
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          />
          <input
            placeholder="Thumbnail URL"
            value={formData.thumbnailUrl}
            onChange={(event) => setFormData({ ...formData, thumbnailUrl: event.target.value })}
          />
          <div className="split-row">
            <select
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            >
              {topics.map((topic) => (
                <option key={topic._id} value={topic.category}>
                  {topic.category}
                </option>
              ))}
            </select>
            <select
              value={formData.topicSlug}
              onChange={(event) => setFormData({ ...formData, topicSlug: event.target.value })}
            >
              {topics.map((topic) => (
                <option key={topic._id} value={topic.slug}>
                  {topic.name}
                </option>
              ))}
            </select>
            <select
              value={formData.level}
              onChange={(event) => setFormData({ ...formData, level: event.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="split-row">
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(event) => setFormData({ ...formData, price: event.target.value })}
            />
            <select
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <textarea
            placeholder="Learning outcomes, one per line"
            rows="4"
            value={formData.learningOutcomes}
            onChange={(event) =>
              setFormData({ ...formData, learningOutcomes: event.target.value })
            }
          />
          <textarea
            placeholder="Requirements, one per line"
            rows="4"
            value={formData.requirements}
            onChange={(event) => setFormData({ ...formData, requirements: event.target.value })}
          />
          {message ? <div className="success-note">{message}</div> : null}
          <button className="primary-button full-width" type="submit">
            Save Course
          </button>
        </form>

        <div className="panel">
          <h3>Your content pipeline</h3>
          <div className="list-stack">
            {creatorDashboard ? (
              <>
                <div className="list-item">
                  <div>
                    <strong>Drafts</strong>
                    <p>Content not submitted yet</p>
                  </div>
                  <span>{creatorDashboard.contentPipeline.drafts}</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Under review</strong>
                    <p>Awaiting moderator decision</p>
                  </div>
                  <span>{creatorDashboard.contentPipeline.underReview}</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Needs changes</strong>
                    <p>Revise and resubmit</p>
                  </div>
                  <span>{creatorDashboard.contentPipeline.needsChanges}</span>
                </div>
                <div className="list-item">
                  <div>
                    <strong>Published</strong>
                    <p>Live content in the community</p>
                  </div>
                  <span>{creatorDashboard.contentPipeline.published}</span>
                </div>
              </>
            ) : (
              <div className="state-card compact">Loading creator pipeline...</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <form className="panel" onSubmit={handleBlogSubmit}>
          <h3>Create a blog draft</h3>
          <input
            placeholder="Blog title"
            value={blogForm.title}
            onChange={(event) => setBlogForm({ ...blogForm, title: event.target.value })}
          />
          <input
            placeholder="Short excerpt"
            value={blogForm.excerpt}
            onChange={(event) => setBlogForm({ ...blogForm, excerpt: event.target.value })}
          />
          <select
            value={blogForm.topicSlug}
            onChange={(event) => setBlogForm({ ...blogForm, topicSlug: event.target.value })}
          >
            {topics.map((topic) => (
              <option key={topic._id} value={topic.slug}>
                {topic.name}
              </option>
            ))}
          </select>
          <textarea
            rows="8"
            placeholder="Write your blog draft"
            value={blogForm.content}
            onChange={(event) => setBlogForm({ ...blogForm, content: event.target.value })}
          />
          <select
            value={blogForm.status}
            onChange={(event) => setBlogForm({ ...blogForm, status: event.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Submit for review</option>
          </select>
          {message ? <div className="success-note">{message}</div> : null}
          <button className="primary-button full-width" type="submit">
            Save Blog Draft
          </button>
        </form>

        <div className="panel">
          <h3>Your courses</h3>
          <div className="list-stack">
            {courses.length ? (
              courses.map((course) => (
                <div key={course._id} className="list-item">
                  <div>
                    <strong>{course.title}</strong>
                    <p>
                      {course.topicSlug} - {course.category}
                    </p>
                  </div>
                  <span className="badge">{course.status}</span>
                </div>
              ))
            ) : (
              <div className="state-card compact">No courses created yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Your blog drafts</h3>
        <div className="list-stack">
          {blogs.length ? (
            blogs.map((blog) => (
              <div key={blog._id} className="list-item">
                <div>
                  <strong>{blog.title}</strong>
                  <p>{blog.topicSlug}</p>
                </div>
                <span className="badge">{blog.status}</span>
              </div>
            ))
          ) : (
            <div className="state-card compact">No blog drafts yet.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InstructorDashboardPage;
