"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface PostSummary {
  slug: string;
  title: string;
  date: string;
  updatedAt?: string | null;
  summary: string;
  author: string;
  tags: string[];
  coverImage?: string | null;
}

export default function AdminPage() {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlug, setEditingSlug] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);

  // Manage posts state
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const router = useRouter();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setCoverImage(""); // reset previously uploaded URL
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setCoverImage("");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(newTitle));
    }
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setAuthor("");
    setTags("");
    clearImage();
    setIsEditing(false);
    setEditingSlug("");
  };

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "manage") {
      loadPosts();
    }
  }, [activeTab, loadPosts]);

  const startEdit = async (postSlug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postSlug}`);
      const data = await res.json();
      if (res.ok) {
        setTitle(data.title || "");
        setSlug(data.slug || postSlug);
        setSummary(data.summary || "");
        setContent(data.content || "");
        setAuthor(data.author || "");
        setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
        setCoverImage(data.coverImage || "");
        setImagePreview(data.coverImage || "");
        setImageFile(null);
        setIsEditing(true);
        setEditingSlug(postSlug);
        setActiveTab("create");
      } else {
        await Swal.fire({
          title: "Error!",
          text: "Failed to load post for editing.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: "var(--bg-card, #1a1a2e)",
          color: "var(--text-primary, #e2e8f0)",
        });
      }
    } catch {
      await Swal.fire({
        title: "Error!",
        text: "Failed to load post for editing.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: "var(--bg-card, #1a1a2e)",
        color: "var(--text-primary, #e2e8f0)",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postSlug: string) => {
    const confirm = await Swal.fire({
      title: "Delete Post?",
      text: `Are you sure you want to delete "${postSlug}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "var(--bg-card, #1a1a2e)",
      color: "var(--text-primary, #e2e8f0)",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/posts/${postSlug}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          title: "Deleted!",
          text: `"${postSlug}" has been deleted successfully.`,
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: "var(--bg-card, #1a1a2e)",
          color: "var(--text-primary, #e2e8f0)",
        });
        loadPosts();
      } else {
        await Swal.fire({
          title: "Error!",
          text: data.error || "Failed to delete post.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: "var(--bg-card, #1a1a2e)",
          color: "var(--text-primary, #e2e8f0)",
        });
      }
    } catch {
      await Swal.fire({
        title: "Error!",
        text: "An error occurred while deleting.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: "var(--bg-card, #1a1a2e)",
        color: "var(--text-primary, #e2e8f0)",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Upload image if one was selected
      let uploadedImageUrl = coverImage;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          await Swal.fire({
            title: "Upload Failed!",
            text: uploadData.error || "Image upload failed.",
            icon: "error",
            confirmButtonColor: "#ef4444",
            background: "var(--bg-card, #1a1a2e)",
            color: "var(--text-primary, #e2e8f0)",
          });
          setLoading(false);
          return;
        }
        uploadedImageUrl = uploadData.url;
        setCoverImage(uploadedImageUrl);
      }

      // Step 2: Create or update the post
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/posts/${editingSlug}` : "/api/posts";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary,
          content,
          author,
          tags,
          coverImage: uploadedImageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: isEditing ? "Updated!" : "Created!",
          text:
            data.message ||
            (isEditing
              ? "Post updated successfully!"
              : "Post created successfully!"),
          icon: "success",
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          background: "var(--bg-card, #1a1a2e)",
          color: "var(--text-primary, #e2e8f0)",
        });
        if (!isEditing) {
          resetForm();
        }
      } else {
        await Swal.fire({
          title: "Error!",
          text:
            data.error ||
            (isEditing ? "Failed to update post" : "Failed to create post"),
          icon: "error",
          confirmButtonColor: "#ef4444",
          background: "var(--bg-card, #1a1a2e)",
          color: "var(--text-primary, #e2e8f0)",
        });
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: "An error occurred. Please try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: "var(--bg-card, #1a1a2e)",
        color: "var(--text-primary, #e2e8f0)",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Stay",
      background: "var(--bg-card, #1a1a2e)",
      color: "var(--text-primary, #e2e8f0)",
    });
    if (!confirm.isConfirmed) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      padding: "2rem 1rem",
      backgroundColor: "var(--bg-primary)",
    },
    wrapper: {
      maxWidth: "56rem",
      margin: "0 auto",
    },
    header: {
      textAlign: "center" as const,
      marginBottom: "3rem",
    },
    title: {
      fontSize: "3.75rem",
      fontWeight: 700,
      marginBottom: "0.75rem",
      letterSpacing: "-0.02em",
      color: "var(--text-primary)",
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    subtitle: {
      fontSize: "1.125rem",
      marginBottom: "1.5rem",
      color: "var(--text-secondary)",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      fontWeight: 600,
      transition: "opacity 0.2s",
      backgroundColor: "var(--accent-blue)",
      color: "var(--text-primary)",
      textDecoration: "none",
      cursor: "pointer",
    },
    form: {
      borderRadius: "1rem",
      border: "1px solid var(--border-color)",
      padding: "2.5rem",
      backgroundColor: "var(--bg-card)",
      transition: "all 0.3s",
    },
    fieldGroup: {
      marginBottom: "2rem",
    },
    label: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: 600,
      marginBottom: "0.75rem",
      color: "var(--text-primary)",
    },
    required: {
      color: "var(--accent-orange)",
    },
    input: {
      width: "100%",
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid var(--border-color)",
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)",
      fontWeight: 500,
      transition: "all 0.2s",
      outline: "none",
      fontSize: "1rem",
    },
    textarea: {
      width: "100%",
      padding: "0.75rem 1rem",
      borderRadius: "0.5rem",
      border: "1px solid var(--border-color)",
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)",
      fontWeight: 500,
      transition: "all 0.2s",
      outline: "none",
      fontSize: "1rem",
      resize: "vertical" as const,
    },
    textareaCode: {
      fontFamily: "monospace",
      fontSize: "0.875rem",
    },
    hint: {
      fontSize: "0.75rem",
      marginTop: "0.5rem",
      color: "var(--text-muted)",
    },
    fieldGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    buttonContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1rem",
      paddingTop: "1rem",
    },
    submitButton: {
      flex: 1,
      padding: "1rem 1.5rem",
      color: "white",
      fontWeight: 600,
      borderRadius: "0.5rem",
      transition: "all 0.2s",
      outline: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "1rem",
    },
    clearButton: {
      padding: "1rem 1.5rem",
      fontWeight: 600,
      borderRadius: "0.5rem",
      transition: "all 0.2s",
      outline: "none",
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-color)",
      cursor: "pointer",
      fontSize: "1rem",
    },
    tipsContainer: {
      marginTop: "2rem",
      borderRadius: "0.75rem",
      border: "1px solid var(--accent-purple)",
      padding: "1.5rem",
      backgroundColor: "var(--bg-secondary)",
    },
    tipsTitle: {
      fontSize: "1.125rem",
      fontWeight: 700,
      marginBottom: "1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      justifyContent: "center",
      color: "var(--text-primary)",
    },
    tipsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "0.75rem 2rem",
    },
    tipItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    code: {
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.75rem",
      fontFamily: "monospace",
      whiteSpace: "nowrap" as const,
      backgroundColor: "var(--bg-primary)",
      color: "var(--accent-orange)",
    },
    tipText: {
      fontSize: "0.875rem",
      color: "var(--text-secondary)",
    },
  };

  return (
    <div style={styles.container}>
      <style jsx>{`
        @media (min-width: 640px) {
          .field-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .button-container {
            flex-direction: row;
          }
          .tips-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .form-padding {
            padding: 2.5rem;
          }
        }
      `}</style>

      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Panel</h1>
          <p style={styles.subtitle}>
            {isEditing
              ? `Editing: "${title || editingSlug}"`
              : "Create and manage your blog posts"}
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link href="/" style={styles.backButton}>
              ← Back to Home
            </Link>
            <button
              onClick={handleLogout}
              type="button"
              style={{
                ...styles.backButton,
                backgroundColor: "var(--accent-red, #ef4444)",
              }}
            >
              Logout
            </button>
          </div>

          {/* Tab navigation */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginTop: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                if (!isEditing) resetForm();
              }}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "create"
                    ? "var(--accent-blue)"
                    : "var(--bg-secondary)",
                color:
                  activeTab === "create" ? "white" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              ✏️ {isEditing ? "Edit Post" : "Create Post"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "manage"
                    ? "var(--accent-blue)"
                    : "var(--bg-secondary)",
                color:
                  activeTab === "manage" ? "white" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              📋 Manage Posts
            </button>
          </div>
        </div>

        {/* ── Manage Posts Panel ── */}
        {activeTab === "manage" && (
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--border-color)",
              padding: "2rem",
              backgroundColor: "var(--bg-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                All Posts
              </h2>
              <button
                type="button"
                onClick={loadPosts}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {postsLoading ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "var(--text-muted)",
                }}
              >
                Loading posts…
              </p>
            ) : posts.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "var(--text-muted)",
                }}
              >
                No posts yet. Go create one!
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    style={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border-color)",
                      padding: "1.25rem 1.5rem",
                      backgroundColor: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    {/* Post info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: "0.25rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {post.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        /{post.slug} ·{" "}
                        {post.date
                          ? new Date(post.date).toLocaleDateString()
                          : "no date"}
                        {post.author ? ` · ${post.author}` : ""}
                        {post.updatedAt ? " · ✏️ edited" : ""}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.375rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: "0.125rem 0.5rem",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                backgroundColor: "rgba(139,92,246,0.15)",
                                color: "var(--accent-purple, #8b5cf6)",
                                border: "1px solid rgba(139,92,246,0.3)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexShrink: 0,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => startEdit(post.slug)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--accent-blue)",
                          backgroundColor: "transparent",
                          color: "var(--accent-blue)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(post.slug)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #ef4444",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Create / Edit Form ── */}
        {activeTab === "create" && (
          <form
            onSubmit={handleSubmit}
            style={styles.form}
            className="form-padding"
          >
            {isEditing && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(59,130,246,0.1)",
                  border: "1px solid var(--accent-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    color: "var(--accent-blue)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  ✏️ Editing post:{" "}
                  <code style={{ fontFamily: "monospace" }}>
                    /{editingSlug}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--accent-blue)",
                    backgroundColor: "transparent",
                    color: "var(--accent-blue)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            )}
            <div style={styles.fieldGroup}>
              <label htmlFor="title" style={styles.label}>
                Post Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter your post title"
                required
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="slug" style={styles.label}>
                URL Slug <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                required
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              />
              <p style={styles.hint}>Auto-generated from title (editable)</p>
            </div>

            <div style={styles.fieldGrid} className="field-grid">
              <div style={styles.fieldGroup}>
                <label htmlFor="summary" style={styles.label}>
                  Summary <span style={styles.required}>*</span>
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of your post"
                  required
                  rows={3}
                  style={{ ...styles.textarea, resize: "none" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="author" style={styles.label}>
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name (optional)"
                  style={styles.input}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="coverImageInput" style={styles.label}>
                Cover Image / Thumbnail
              </label>
              <div
                style={{
                  border: `2px dashed ${imagePreview ? "var(--accent-blue)" : "var(--border-color)"}`,
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  backgroundColor: "var(--bg-secondary)",
                  transition: "border-color 0.2s",
                  textAlign: "center",
                }}
              >
                {imagePreview ? (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      style={{
                        maxHeight: "200px",
                        maxWidth: "100%",
                        borderRadius: "0.5rem",
                        objectFit: "cover",
                        border: "1px solid var(--border-color)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      style={{
                        position: "absolute",
                        top: "-0.5rem",
                        right: "-0.5rem",
                        width: "1.75rem",
                        height: "1.75rem",
                        borderRadius: "9999px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "1rem",
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{
                        color: "var(--text-muted)",
                        margin: "0 auto 0.75rem",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      Click to choose a cover image
                    </p>
                  </div>
                )}
                <label
                  htmlFor="coverImageInput"
                  style={{
                    display: "inline-block",
                    marginTop: imagePreview ? "0.75rem" : "0",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--accent-blue)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  {imagePreview ? "🔄 Change Image" : "📷 Choose Image"}
                </label>
                <input
                  type="file"
                  id="coverImageInput"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
              <p style={styles.hint}>
                JPEG, PNG, WebP or GIF · Max 5 MB · Used as thumbnail in
                listings
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="tags" style={styles.label}>
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              />
              <p style={styles.hint}>Comma separated</p>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="content" style={styles.label}>
                Post Content <span style={styles.required}>*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in Markdown..."
                required
                rows={14}
                style={{ ...styles.textarea, ...styles.textareaCode }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              />
              <p style={styles.hint}>
                Markdown syntax supported with syntax highlighting
              </p>
            </div>

            <div style={styles.buttonContainer} className="button-container">
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  backgroundColor: loading
                    ? "var(--accent-purple)"
                    : "var(--accent-blue)",
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? isEditing
                    ? "⏳ Updating..."
                    : "⏳ Publishing..."
                  : isEditing
                    ? "💾 Update Post"
                    : "🚀 Publish Post"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={styles.clearButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--border-color)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
              >
                {isEditing ? "✕ Cancel Edit" : "↻ Clear Form"}
              </button>
            </div>

            <div style={styles.tipsContainer}>
              <h3 style={styles.tipsTitle}>📝 Markdown Formatting Guide</h3>
              <div style={styles.tipsGrid} className="tips-grid">
                <div style={styles.tipItem}>
                  <code style={styles.code}># H1</code>
                  <span style={styles.tipText}>Largest heading</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>## H2</code>
                  <span style={styles.tipText}>Medium heading</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>**bold**</code>
                  <span style={styles.tipText}>Bold text</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>*italic*</code>
                  <span style={styles.tipText}>Italic text</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>`code`</code>
                  <span style={styles.tipText}>Inline code</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>[link](url)</code>
                  <span style={styles.tipText}>Links</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>- item</code>
                  <span style={styles.tipText}>Bullet list</span>
                </div>
                <div style={styles.tipItem}>
                  <code style={styles.code}>```</code>
                  <span style={styles.tipText}>Code block</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
