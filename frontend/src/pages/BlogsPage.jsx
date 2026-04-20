import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    api.get("/blogs").then(({ data }) => setBlogs(data.blogs)).catch(console.error);
  }, []);

  return (
    <section className="section-stack">
      <div className="section-header">
        <div>
          <span className="eyebrow">Blogs</span>
          <h2>Learn from proven contributors</h2>
          <p className="section-copy">
            Essays, study notes, and insight pieces from contributors who earned topic trust.
          </p>
        </div>
      </div>

      <div className="card-grid">
        {blogs.map((blog) => (
          <article className="panel editorial-card" key={blog._id}>
            <span className="badge">{blog.topicSlug}</span>
            <h3>{blog.title}</h3>
            <p>{blog.excerpt}</p>
            <div className="meta-row">
              <span>{blog.author?.name}</span>
              <span>{blog.engagement?.views || 0} views</span>
            </div>
            <Link className="primary-button full-width" to={`/blogs/${blog.slug}`}>
              Read Article
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default BlogsPage;
