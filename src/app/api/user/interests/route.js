import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    // Check if user is authenticated
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { interests } = await request.json();

    if (!interests || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: "Invalid interests data" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Update user's interests
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { interests: interests,hasInterests:true },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "Interests saved successfully",
        interests: updatedUser.interests 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error saving interests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Check if user is authenticated
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user's interests
    const dbUser = await User.findById(user.id);
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { interests: dbUser.interests || [] },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 