import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "../../../../lib/mongodb";
import Dataset from "../../../../models/Dataset";
import MlModel from "../../../../models/MlModel";
import { uploadToGCS } from '../../../../lib/gcs';

// Helper function for parallel uploads with retry logic
async function uploadFileWithRetry(file, filePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const uploadResult = await uploadToGCS(file, filePath);
      if (uploadResult.success) {
        return uploadResult;
      }
      throw new Error(uploadResult.error);
    } catch (error) {
      console.warn(`Upload attempt ${attempt} failed for ${filePath}:`, error.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload ${filePath} after ${maxRetries} attempts: ${error.message}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Process files in parallel batches
async function processSplitParallel(files, split, className, modelId, classIndex, batchSize = 5) {
  const processedImages = [];
  const batches = [];
  
  // Create batches
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  // Process each batch in parallel
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchPromises = batch.map(async (file, fileIndex) => {
      const globalIndex = batchIndex * batchSize + fileIndex;
      const ext = file.name.split('.').pop();
      const filePath = `${modelId}/${split}/${className}/${className}_${globalIndex + 1}.${ext}`;
      
      const uploadResult = await uploadFileWithRetry(file, filePath);
      
      return {
        id: Date.now() + globalIndex,
        fileName: `${className}_${globalIndex + 1}`,
        fileType: file.type,
        fileSize: file.size,
        storagePath: `gs://questwhisper-ml-datasets/${uploadResult.path}`,
        downloadURL: uploadResult.url,
        uploadedAt: new Date(),
        trainingLabel: classIndex + 1
      };
    });

    // Wait for this batch to complete before moving to next
    const batchResults = await Promise.all(batchPromises);
    processedImages.push(...batchResults);
  }

  return processedImages;
}

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const metadata = JSON.parse(formData.get('metadata'));

    const { modelId, name, description, category, modelType, classes } = metadata;

    // Validate required fields
    if (!modelId || !name || !category || !modelType || !classes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Collect files
    const filesMap = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files[')) {
        const match = key.match(/files\[(\d+)\]\[(\d+)\]/);
        if (match) {
          const classId = parseInt(match[1]);
          const imgId = parseInt(match[2]);
          if (!filesMap[classId]) filesMap[classId] = {};
          filesMap[classId][imgId] = value; // value is File
        }
      }
    }

    // Validate classes and files
    if (classes.length < 2) {
      return NextResponse.json(
        { error: "At least 2 classes are required" },
        { status: 400 }
      );
    }

    let totalImages = 0;
    const processedClasses = [];

    // Process all classes in parallel
    const classProcessingPromises = classes.map(async (cls, classIndex) => {
      const classFiles = Object.values(filesMap[cls.id] || {});
      const imageCount = classFiles.length;

      if (imageCount < 5) {
        throw new Error(`Class ${cls.name} needs at least 5 images`);
      }

      // Shuffle files
      classFiles.sort(() => Math.random() - 0.5);

      // Split 80/20
      const trainCount = Math.floor(imageCount * 0.8);
      const trainFiles = classFiles.slice(0, trainCount);
      const testFiles = classFiles.slice(trainCount);

      // Process train and test splits in parallel
      const [trainImages, testImages] = await Promise.all([
        processSplitParallel(trainFiles, 'train', cls.name, modelId, classIndex),
        processSplitParallel(testFiles, 'test', cls.name, modelId, classIndex)
      ]);

      return {
        id: classIndex + 1,
        name: cls.name,
        images: [...trainImages, ...testImages],
        imageCount
      };
    });

    // Wait for all classes to be processed
    const classResults = await Promise.all(classProcessingPromises);
    
    // Calculate total images and prepare processed classes
    classResults.forEach(result => {
      totalImages += result.imageCount;
      processedClasses.push({
        id: result.id,
        name: result.name,
        images: result.images
      });
    });

    if (totalImages < 10) {
      return NextResponse.json(
        { error: "At least 10 total images are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create or update dataset
    const datasetData = {
      userId: session.user.id,
      modelId,
      name,
      description: description || `${category} classification dataset`,
      category,
      modelType,
      classes: processedClasses,
      totalImages,
      status: 'ready'
    };

    // Check if user already has a dataset with this name
    const existingDataset = await Dataset.findOne({
      userId: session.user.id,
      name: name
    });

    let dataset;
    if (existingDataset) {
      // Update existing dataset
      Object.assign(existingDataset, datasetData);
      dataset = await existingDataset.save();
    } else {
      // Create new dataset
      dataset = new Dataset(datasetData);
      await dataset.save();
    }

    // Update the corresponding MlModel with output_units and dataset info
    const model = await MlModel.findOne({ modelId });
    if (model) {
      model.output_units = classes.length;
      model.dataset.uploaded = true;
      model.dataset.totalSamples = totalImages;
      model.dataset.classes = processedClasses.map((cls, index) => ({
        id: index + 1,
        name: cls.name,
        sampleCount: cls.images.length
      }));
      model.dataset.uploadedAt = new Date();
      model.dataset.datasetPath = `gs://questwhisper-ml-datasets/${modelId}`;
      await model.save();
    }

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset._id,
        name: dataset.name,
        category: dataset.category,
        modelType: dataset.modelType,
        totalImages: dataset.totalImages,
        classes: dataset.classes.length,
        status: dataset.status,
        createdAt: dataset.createdAt
      }
    });

  } catch (error) {
    console.error("Error saving dataset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save dataset" },
      { status: 500 }
    );
  }
} 