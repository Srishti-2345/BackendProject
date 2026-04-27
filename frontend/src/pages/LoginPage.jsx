import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const destinationByRole = {
    reviewer: "/review",
    instructor: "/create",
    student: "/dashboard",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const user = await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate(destinationByRole[user.role] || "/dashboard");
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-layout">
        <div className="auth-story panel editorial-panel">
          <span className="eyebrow">Return to your studio</span>
          <h2>Pick up where your learning momentum left off.</h2>
          <p>
            Track XP, finish lessons, generate quizzes, and step into creator access when
            your topic mastery is ready.
          </p>
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Login</h2>
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
          {error ? <div className="error-note">{error}</div> : null}
          <button className="primary-button full-width" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
