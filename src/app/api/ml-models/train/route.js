import { NextResponse } from 'next/server';
import MlModel from '@/models/MlModel';
import Dataset from '@/models/Dataset';
import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { cookies } from 'next/headers';

export async function POST(request) {
  let modelId;
  let model;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET, 
      raw:true
    });

    await connectToDatabase();
    const requestBody = await request.json();
    modelId = requestBody.modelId;
    model = await MlModel.findOne({ modelId, ownerId: session.user.id });
    if (!model) {
      return NextResponse.json({ error: 'Model not found or unauthorized' }, { status: 404 });
    }
    const dataset = await Dataset.findOne({ modelId, userId: session.user.id });
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    // Set status to setting up at the beginning
    model.status = 'setting_up';
    await model.save();
    
    // Construct training data with stratified split per class
    let training_image_urls = [];
    let training_image_labels = [];
    let validation_image_urls = [];
    let validation_image_labels = [];
    let test_image_urls = [];
    let test_image_labels = [];
    
    dataset.classes.forEach(cls => {
      const train_images = cls.images
        .filter(img => img.storagePath.includes('/train/'))
        .map(img => ({
          downloadURL: img.downloadURL,
          label: img.trainingLabel
        }));
      const test_images = cls.images
        .filter(img => img.storagePath.includes('/test/'))
        .map(img => ({
          downloadURL: img.downloadURL,
          label: img.trainingLabel
        }));
      // Shuffle train_images
      train_images.sort(() => Math.random() - 0.5);
      const train_total = train_images.length;
      const train_end = Math.floor(train_total * 0.8);
      training_image_urls.push(...train_images.slice(0, train_end).map(i => i.downloadURL));
      training_image_labels.push(...train_images.slice(0, train_end).map(i => i.label));
      validation_image_urls.push(...train_images.slice(train_end).map(i => i.downloadURL));
      validation_image_labels.push(...train_images.slice(train_end).map(i => i.label));
      // Add test images directly
      test_image_urls.push(...test_images.map(i => i.downloadURL));
      test_image_labels.push(...test_images.map(i => i.label));
    });
    if (training_image_urls.length === 0 || validation_image_urls.length === 0) {
      // Set status to failed if insufficient data
      await model.failTraining();
      return NextResponse.json({ error: 'Insufficient training/validation images' }, { status: 400 });
    }
    if (test_image_urls.length === 0) {
      console.warn('No test images found');
    }
    // Determine task_type based on dataset modelType
    let task_type = 'multiclass_classification';
    if (dataset.modelType === 'object-detection') {
      task_type = 'object_detection'; // Adjust as needed
    } else if (dataset.modelType === 'text-classification') {
      task_type = 'text_classification';
    }
    const body = {
      modelId: model.modelId,
      epochs: model.epochs,
      batch_size: model.batchSize,
      learning_rate: model.config.learning_rate,
      training_image_urls,
      training_image_labels,
      validation_image_urls,
      validation_image_labels,
      test_image_urls,
      test_image_labels,
      image_config: {
        target_size: model.input_shape.slice(0, 2),
        normalization: "imagenet"
      },
      task_type,
      preprocessor_type: "standard",
      config: model.config
    };

    const response = await fetch('https://questwhisper-ml-720003427280.us-central1.run.app/models/train', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(body),
       // Add timeout configuration
    signal: AbortSignal.timeout(600000), // 10 minutes timeout
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.log("Error: "+JSON.stringify(errorData.detail))
      // Set status to failed if the external API call fails
      await model.failTraining();
      throw new Error('Failed to start training');
    }
    const result = await response.json();
    return NextResponse.json({ success: true, message: 'Training started', result });
  } catch (error) {
    console.error('Error in train endpoint:', error);
    
    // Set status to failed if any error occurs
    try {
      if (model && modelId) {
        await model.failTraining();
      }
    } catch (updateError) {
      console.error('Error updating model status to failed:', updateError);
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 