import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET, 
      raw: true
    });

    const requestBody = await request.json();
    const { modelId, image_url, preprocess = true, return_confidence = true } = requestBody;

    if (!modelId || !image_url) {
      return NextResponse.json({ error: 'Model ID and image URL are required' }, { status: 400 });
    }

    // Call external ML API
    const response = await fetch('https://questwhisper-ml-720003427280.us-central1.run.app/models/predict-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        modelId,
        image_url,
        preprocess,
        return_confidence
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ML API Error:', errorData);
      return NextResponse.json({ 
        error: errorData.error || errorData.detail || 'Failed to get prediction' 
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in predict endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 