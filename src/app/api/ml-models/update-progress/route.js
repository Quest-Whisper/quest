import { NextResponse } from 'next/server';
import MlModel from '@/models/MlModel';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request) {
  try {
    await connectToDatabase();
    const { modelId, currentEpoch, accuracy, loss, isComplete = false } = await request.json();
    const model = await MlModel.findOne({ modelId });
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    model.training.currentEpoch = currentEpoch;
    model.training.logs.push({
      epoch: currentEpoch,
      accuracy,
      loss,
      timestamp: new Date()
    });
    if (isComplete) {
      model.completeTraining(accuracy, loss);
    }
    await model.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 