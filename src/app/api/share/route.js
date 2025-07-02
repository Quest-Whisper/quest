import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import SharedContent from "@/models/SharedContent";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { content, title, sources, displayImage } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Generate a unique share ID
    const shareId = generateShareId();
    
    // Create shared content in database
    const shareData = await SharedContent.create({
      shareId,
      content,
      title: title || "QuestWhisper AI Response",
      sources: sources || [],
      displayImage: displayImage || null,
      sharedBy: {
        name: session.user.name,
        email: session.user.email,
        userId: session.user.id,
      },
    });

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareId}`;

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      data: shareData,
    });

  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find and increment view count
    const data = await SharedContent.findOneAndUpdate(
      { shareId, isActive: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!data) {
      return NextResponse.json(
        { error: "Shared content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Error fetching shared content:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared content" },
      { status: 500 }
    );
  }
}

function generateShareId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 