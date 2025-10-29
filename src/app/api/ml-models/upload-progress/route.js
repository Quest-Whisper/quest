import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-memory store for upload progress (in production, use Redis or similar)
const uploadProgress = new Map();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    const progressKey = `${session.user.id}-${modelId}`;
    const progress = uploadProgress.get(progressKey) || {
      current: 0,
      total: 0,
      status: 'idle',
      currentFile: '',
      errors: [],
      lastUpdated: Date.now()
    };

    return NextResponse.json({ progress });

  } catch (error) {
    console.error("Error getting upload progress:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { modelId, progress } = await request.json();

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    const progressKey = `${session.user.id}-${modelId}`;
    uploadProgress.set(progressKey, {
      ...progress,
      lastUpdated: Date.now()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating upload progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Clean up progress after 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [key, progress] of uploadProgress.entries()) {
    if (now - progress.lastUpdated > 3600000) { // 1 hour
      uploadProgress.delete(key);
    }
  }
}, 600000); // Clean every 10 minutes 