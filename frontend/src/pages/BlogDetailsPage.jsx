import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/client.js";
import DiscussionPanel from "../components/DiscussionPanel.jsx";

const BlogDetailsPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    api.get(`/blogs/slug/${slug}`).then(({ data }) => setBlog(data.blog)).catch(console.error);
  }, [slug]);

  if (!blog) {
    return <div className="state-card">Loading article...</div>;
  }

  return (
    <section className="section-stack">
      <article className="panel article-panel editorial-panel">
        <span className="badge">{blog.topicSlug}</span>
        <h1>{blog.title}</h1>
        <p className="lead">{blog.excerpt}</p>
        <div className="article-body">{blog.content}</div>
      </article>

      <DiscussionPanel contextType="blog" contextId={blog._id} topicSlug={blog.topicSlug} />
    </section>
  );
};

export default BlogDetailsPage;
