import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import MlModel from "@/models/MlModel";

// Model schema for validation
const validateModelData = (data) => {
  const required = ['name', 'modelType', 'category', 'modelId'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (data.name.length < 3) {
    throw new Error("Model name must be at least 3 characters long");
  }

  if (data.modelId.length < 5) {
    throw new Error("Model ID must be at least 5 characters long");
  }

  // Validate target accuracy if provided
  if (data.targetAccuracy !== undefined) {
    if (data.targetAccuracy < 0.1 || data.targetAccuracy > 1.0) {
      throw new Error("Target accuracy must be between 0.1 and 1.0");
    }
  }

  // Validate dataset requirements length if provided
  if (data.datasetRequirements && data.datasetRequirements.length > 1000) {
    throw new Error("Dataset requirements cannot exceed 1000 characters");
  }

  return true;
};

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const modelData = await request.json();

    // Validate required fields
    validateModelData(modelData);

    // Connect to database
    await connectToDatabase();

    // Check if model ID already exists
    const existingModel = await MlModel.findOne({ modelId: modelData.modelId });
    if (existingModel) {
      return NextResponse.json(
        { error: "Model ID already exists. Please try again." },
        { status: 409 }
      );
    }

    // Create new model using Mongoose
    const newModel = new MlModel({
      name: modelData.name.trim(),
      description: modelData.description?.trim() || "",
      datasetRequirements: modelData.datasetRequirements?.trim() || "",
      targetAccuracy: modelData.targetAccuracy || 0.85,
      modelType: modelData.modelType,
      category: modelData.category,
      modelId: modelData.modelId,
      teamMembers: modelData.teamMembers || [session.user.id],
      ownerId: session.user.id,
      input_shape: modelData.input_shape || [224, 224, 3],
      epochs: modelData.epochs || 10,
      batchSize: modelData.batchSize || 32,
      config: {
        base_model: modelData.config?.base_model || 'resnet50',
        use_attention: modelData.config?.use_attention || false,
        use_data_augmentation: modelData.config?.use_data_augmentation || true,
        dropout_rate: modelData.config?.dropout_rate || 0.5,
        fine_tune_layers: modelData.config?.fine_tune_layers || 10,
        learning_rate: modelData.config?.learning_rate || 0.001,
        ...modelData.config
      },
      createdBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      }
    });

    // Save the model
    const savedModel = await newModel.save();

    if (!savedModel._id) {
      throw new Error("Failed to create model in database");
    }

    // Return success response
    return NextResponse.json({
      success: true,
      modelId: savedModel.modelId,
      _id: savedModel._id.toString(),
      message: "Model created successfully",
      nextStep: "dataset-upload"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating model:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Model ID already exists. Please try again." },
        { status: 409 }
      );
    }

    // Handle specific error types
    if (error.message.includes("Missing required fields") || 
        error.message.includes("must be at least")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create model. Please try again." },
      { status: 500 }
    );
  }
} 