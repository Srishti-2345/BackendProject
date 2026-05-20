import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const CourseDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [existingEnrollmentId, setExistingEnrollmentId] = useState("");
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/courses/slug/${slug}`);
        setCourse(data.course);
      } catch (error) {
        setMessage(error.response?.data?.message || "Could not load course");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [slug]);

  useEffect(() => {
    const loadEnrollmentStatus = async () => {
      if (!user || user.role !== "student" || !course?._id) {
        setExistingEnrollmentId("");
        return;
      }

      try {
        setCheckingEnrollment(true);
        const { data } = await api.get("/enrollments/me");
        const existingEnrollment = (data.enrollments || []).find(
          (item) => item.course?._id === course._id
        );
        setExistingEnrollmentId(existingEnrollment?._id || "");
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    loadEnrollmentStatus();
  }, [course?._id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (existingEnrollmentId) {
      navigate(`/learn/${existingEnrollmentId}`);
      return;
    }

    try {
      const checkout = await api.post("/enrollments/checkout", {
        courseId: course._id,
      });
      const confirm = await api.post("/enrollments/confirm", {
        courseId: course._id,
        orderId: checkout.data.order._id,
      });
      setMessage("Enrollment successful. Opening your course...");
      const enrollmentId = confirm.data.enrollment?._id;
      if (enrollmentId) {
        setExistingEnrollmentId(enrollmentId);
        navigate(`/learn/${enrollmentId}`);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Enrollment failed");
    }
  };

  if (loading) {
    return <div className="state-card">Loading course details...</div>;
  }

  if (!course) {
    return <div className="state-card">{message || "Course not found"}</div>;
  }

  const sections = course.sections || [];
  const learningOutcomes = course.learningOutcomes || [];
  const isStudent = user?.role === "student";
  const isEnrolled = Boolean(existingEnrollmentId);

  return (
    <section className="section-stack">
      <div className="details-grid">
        <div className="details-main">
          <span className="badge">{course.topicSlug}</span>
          <h1>{course.title}</h1>
          <p className="lead">{course.subtitle}</p>
          <p>{course.description}</p>

          <div className="panel">
            <h3>What you will learn</h3>
            {learningOutcomes.length ? (
              <ul className="simple-list">
                {learningOutcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="state-card compact">Learning outcomes will appear here.</div>
            )}
          </div>

          <div className="panel">
            <h3>Course content</h3>
            {sections.length ? (
              sections.map((section) => (
                <div key={section.title} className="curriculum-block">
                  <h4>{section.title}</h4>
                  <ul className="simple-list">
                    {section.lessons.map((lesson) => (
                      <li key={lesson.title}>
                        {lesson.title} {lesson.duration ? `- ${lesson.duration}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="state-card compact">Course lessons will appear here.</div>
            )}
          </div>
        </div>

        <aside className="details-sidebar">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="details-image" />
          ) : (
            <div className="details-image catalog-course-media-fallback" />
          )}
          <div className="panel sticky-panel">
            <div className="price-line">Rs. {course.price}</div>
            {isStudent && isEnrolled ? (
              <button
                className="ghost-button full-width enrolled-button"
                type="button"
                onClick={handleEnroll}
              >
                Enrolled
              </button>
            ) : (
              <button
                className="primary-button full-width"
                onClick={handleEnroll}
                disabled={checkingEnrollment}
                type="button"
              >
                {checkingEnrollment ? "Checking access..." : "Enroll Now"}
              </button>
            )}
            <p>Instructor: {course.instructor?.name}</p>
            <p>Level: {course.level}</p>
            <p>Students: {course.enrolledCount}</p>
            {message ? <div className="success-note">{message}</div> : null}
          </div>
        </aside>
      </div>
      <div className="panel discussion-locked-panel">
        <span className="eyebrow">Course discussion</span>
        <h3>Discussion unlocks after enrollment</h3>
        <p>
          Join the course to open the learner discussion space, ask questions, and follow
          implementation threads alongside the lessons.
        </p>
      </div>
    </section>
  );
};

export default CourseDetailsPage;
