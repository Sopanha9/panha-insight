import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "All blog posts",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container py-12">
      <header className="page-header">
        <h1 className="page-title">All Posts</h1>
      </header>

      <section>
        {posts.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>
            No posts yet. Check back soon!
          </p>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="post-item">
                  <div className="post-item-content">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="post-item-image"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="post-item-image">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="post-item-body">
                      <h3 className="post-item-title">{post.title}</h3>
                      <div className="post-item-meta">
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                        {post.author && <span>By {post.author}</span>}
                      </div>
                      {post.summary && (
                        <p className="post-item-summary">{post.summary}</p>
                      )}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="post-item-tags">
                          {post.tags.map((tag) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
