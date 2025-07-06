import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  // Initialize the GenAI helper with your long-lived key
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: 'v1alpha',
  });

  // Token valid for 30 min, allows 1 session start
  const expireTime         = new Date(Date.now() + 30 * 60_000).toISOString();
  const newSessionExpireTime = new Date(Date.now() +  10 * 60_000).toISOString(); // Extended to 10 minutes

  const token = await client.authTokens.create({
    config: {
      uses: 1,
      expireTime,
      newSessionExpireTime,
      httpOptions: { apiVersion: 'v1alpha' },
    },
  });

  console.log("Ephemeral Token : " +JSON.stringify(token))

  return NextResponse.json({ token: token.name });
}
