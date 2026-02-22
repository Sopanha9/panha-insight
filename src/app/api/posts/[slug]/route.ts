import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "posts");

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get("admin_token")?.value;
  const expectedToken = process.env.ADMIN_TOKEN;
  return !!(token && token === expectedToken);
}

// GET /api/posts/[slug] — fetch a single post's raw markdown + metadata
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const filePath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return NextResponse.json({
      slug,
      title: data.title || "",
      date: data.date || "",
      updatedAt: data.updatedAt || null,
      summary: data.summary || "",
      author: data.author || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      coverImage: data.coverImage || "",
      content, // raw markdown body
    });
  } catch (error) {
    console.error("Error reading post:", error);
    return NextResponse.json({ error: "Failed to read post" }, { status: 500 });
  }
}

// PUT /api/posts/[slug] — update an existing post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 },
    );
  }

  try {
    const { slug } = await params;
    const filePath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();

    if (!body.title || !body.summary || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, summary, and content" },
        { status: 400 },
      );
    }

    // Preserve the original creation date
    const existingContents = fs.readFileSync(filePath, "utf8");
    const { data: existingData } = matter(existingContents);

    // Parse tags
    const parsedTags: string[] =
      typeof body.tags === "string"
        ? body.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : Array.isArray(body.tags)
          ? body.tags
          : [];

    const frontmatter: Record<string, unknown> = {
      title: body.title,
      date: existingData.date || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: body.summary,
      author: body.author || "",
      tags: parsedTags,
    };
    if (body.coverImage) {
      frontmatter.coverImage = body.coverImage;
    }

    const fileContent =
      `---\n` +
      Object.entries(frontmatter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
          }
          return `${key}: "${value}"`;
        })
        .join("\n") +
      `\n---\n\n${body.content}`;

    fs.writeFileSync(filePath, fileContent, "utf8");

    return NextResponse.json({
      message: "Post updated successfully",
      slug,
      title: body.title,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post. Please try again." },
      { status: 500 },
    );
  }
}

// DELETE /api/posts/[slug] — delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 },
    );
  }

  try {
    const { slug } = await params;
    const filePath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ message: "Post deleted successfully", slug });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post. Please try again." },
      { status: 500 },
    );
  }
}
