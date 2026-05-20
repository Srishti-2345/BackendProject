import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const REVIEWER_EMAIL_DOMAIN = "chitkara.edu.in";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");

  const destinationByRole = {
    reviewer: "/review",
    instructor: "/create",
    student: "/dashboard",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      formData.role === "reviewer" &&
      !formData.email.toLowerCase().endsWith(`@${REVIEWER_EMAIL_DOMAIN}`)
    ) {
      setError(`Reviewer accounts must use an @${REVIEWER_EMAIL_DOMAIN} email address.`);
      return;
    }

    try {
      setError("");
      const user = await register({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      navigate(destinationByRole[user.role] || "/dashboard");
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleSignup = useCallback(
    async (credential) => {
      try {
        setError("");
        const user = await loginWithGoogle({
          credential,
          role: formData.role,
        });
        navigate(destinationByRole[user.role] || "/dashboard");
      } catch (submitError) {
        setError(submitError.response?.data?.message || "Google sign-up failed");
      }
    },
    [destinationByRole, formData.role, loginWithGoogle, navigate]
  );

  return (
    <section className="auth-shell">
      <div className="auth-layout">
        <div className="auth-story panel editorial-panel">
          <span className="eyebrow">Join the atelier</span>
          <h2>Start as a learner and grow into a trusted contributor.</h2>
          <p>
            Every account begins with progress. Your creator path opens through proof,
            consistency, and community trust.
          </p>
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <input
            placeholder="Full name"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          />
          <select
            value={formData.role}
            onChange={(event) => setFormData({ ...formData, role: event.target.value })}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="reviewer">Reviewer</option>
          </select>
          {formData.role === "reviewer" ? (
            <div className="state-card compact">
              Reviewer accounts must use an @{REVIEWER_EMAIL_DOMAIN} email address.
            </div>
          ) : null}
          {error ? <div className="error-note">{error}</div> : null}
          <button className="primary-button full-width" type="submit">
            Create Account
          </button>
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <GoogleAuthButton
            onCredential={handleGoogleSignup}
            onError={() => setError("Google sign-up is unavailable right now")}
            text="signup_with"
          />
        </form>
      </div>
    </section>
  );
};

export default RegisterPage;
