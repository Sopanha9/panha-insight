import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("admin_token")?.value;
    const expectedToken = process.env.ADMIN_TOKEN;

    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 },
      );
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF." },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    // Build a unique, safe filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "images", "posts");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(path.join(uploadDir, safeName), Buffer.from(bytes));

    return NextResponse.json(
      { url: `/images/posts/${safeName}` },
      { status: 201 },
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
