import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket('questwhisper-ml-datasets');

export async function uploadToGCS(file, customPath) {
  try {
    const fileRef = bucket.file(customPath);
    await fileRef.save(Buffer.from(await file.arrayBuffer()));
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2491' // Long expiration
    });
    return { success: true, url, path: customPath };
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    return { success: false, error: error.message };
  }
} 