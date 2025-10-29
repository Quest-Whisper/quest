import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import MlModel from "@/models/MlModel";

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get modelId from URL params
    const url = new URL(request.url);
    const modelId = url.searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    console.log("ModelID : "+modelId)

    // Connect to database
    await connectToDatabase();
    // Find the model
    const model = await MlModel.findOne({ 
      modelId: modelId,
      ownerId: session.user.id // Ensure user can only access their own models
    });

    if (!model) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    // Return model data
    return NextResponse.json({
      success: true,
      model: {
        id: model._id,
        name: model.name,
        description: model.description,
        datasetRequirements: model.datasetRequirements,
        targetAccuracy: model.targetAccuracy,
        modelType: model.modelType,
        category: model.category,
        modelId: model.modelId,
        status: model.status,
        createdAt: model.createdAt,
        epochs: model.epochs,
        training: model.training
      }
    });

  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json(
      { error: "Failed to fetch model data" },
      { status: 500 }
    );
  }
} 