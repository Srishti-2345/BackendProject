import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);

  const topicCount = blogs.reduce((map, blog) => {
    if (!blog.topicSlug) {
      return map;
    }
    map[blog.topicSlug] = (map[blog.topicSlug] || 0) + 1;
    return map;
  }, {});

  const topTopics = Object.entries(topicCount).slice(0, 4);

  useEffect(() => {
    api.get("/blogs").then(({ data }) => setBlogs(data.blogs)).catch(console.error);
  }, []);

  return (
    <section className="catalog-shell">
      <aside className="catalog-sidebar panel">
        <div className="catalog-sidebar-block">
          <span className="catalog-label">Blog library</span>
          <h3>Insight feed</h3>
          <p className="section-copy">
            Essays, study notes, and insight pieces from contributors who earned topic trust.
          </p>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Quick overview</span>
          <div className="catalog-chip-stack">
            <span className="catalog-chip">{blogs.length} articles</span>
            <span className="catalog-chip">{Object.keys(topicCount).length} topics</span>
          </div>
        </div>

        <div className="catalog-sidebar-block">
          <span className="catalog-label">Popular topics</span>
          <div className="catalog-topic-list">
            {topTopics.length ? (
              topTopics.map(([topic, count]) => (
                <div key={topic} className="catalog-topic-row">
                  <span>{topic}</span>
                  <strong>{count}</strong>
                </div>
              ))
            ) : (
              <p>No topics published yet.</p>
            )}
          </div>
        </div>
      </aside>

      <div className="catalog-content">
        <div className="catalog-heading">
          <span className="eyebrow">Trending blogs</span>
          <h2>Learn from proven contributors</h2>
          <p className="section-copy">
            Essays, study notes, and insight pieces from contributors who earned topic trust.
          </p>
        </div>

        <div className="catalog-card-grid">
          {blogs.map((blog) => (
            <article className="catalog-blog-card panel editorial-card" key={blog._id}>
              <div className="catalog-blog-card-head">
                <span className="badge">{blog.topicSlug}</span>
                <span className="catalog-card-price">{blog.engagement?.views || 0} views</span>
              </div>
              <h3>{blog.title}</h3>
              <p>{blog.excerpt}</p>
              <div className="meta-row">
                <span>{blog.author?.name}</span>
                <span>Contributor article</span>
              </div>
              <Link className="primary-button full-width" to={`/blogs/${blog.slug}`}>
                Read Article
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogsPage;
