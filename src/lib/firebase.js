import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export async function uploadToFirebase(file, userId) {
  try {
    // Create a unique file name
    const timestamp = Date.now();
    const fileName = `${userId}/attachments/${timestamp}_${file.name}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL,
      fileName: fileName,
      type: file.type,
      size: file.size,
      displayName: file.name
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// New function to handle multiple file uploads
export async function uploadMultipleFilesToFirebase(files, userId, onProgress = null) {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `${userId}/attachments/${timestamp}_${index}_${file.name}`;
      
      // Create a reference to the file location
      const storageRef = ref(storage, fileName);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const result = {
        success: true,
        url: downloadURL,
        fileName: fileName,
        type: file.type,
        size: file.size,
        displayName: file.name
      };
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(index + 1, files.length, result);
      }
      
      return result;
    });

    const results = await Promise.all(uploadPromises);
    
    return {
      success: true,
      files: results,
      totalFiles: files.length
    };
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to validate file types
export function validateFileType(file) {
  const allowedTypes = [
    // Images (processed inline)
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    
    // Documents (uploaded to Gemini File API)
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Audio files (uploaded to Gemini File API)
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac',
    
    // Video files (uploaded to Gemini File API)
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];
  
  return allowedTypes.includes(file.type);
}

// Helper function to validate file size (different limits for different types)
export function validateFileSize(file, maxSizeMB = 20) {
  let maxSize;
  
  if (file.type.startsWith('image/')) {
    maxSize = 20 * 1024 * 1024; // 20MB for images
  } else if (file.type.startsWith('audio/')) {
    maxSize = 100 * 1024 * 1024; // 100MB for audio
  } else if (file.type.startsWith('video/')) {
    maxSize = 500 * 1024 * 1024; // 500MB for video
  } else {
    maxSize = 50 * 1024 * 1024; // 50MB for documents
  }
  
  return file.size <= maxSize;
}

// Helper function to get file type category
export function getFileCategory(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('text/')) return 'text';
  if (file.type.includes('word') || file.type.includes('document')) return 'document';
  if (file.type.includes('sheet') || file.type.includes('excel')) return 'spreadsheet';
  if (file.type.includes('presentation') || file.type.includes('powerpoint')) return 'presentation';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
}

// Helper function to determine if file needs Gemini File API upload
export function needsGeminiUpload(file) {
  // Images are processed inline, everything else needs Gemini File API
  return !file.type.startsWith('image/');
}

// New function to upload generated image blobs to Firebase
export async function uploadGeneratedImageToFirebase(imageBlob, filePath, contentType) {
  try {
    // Create a reference to the file location
    const storageRef = ref(storage, filePath);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, imageBlob, {
      contentType: contentType
    });
    
    // Get and return just the download URL
    return await getDownloadURL(snapshot.ref);
    
  } catch (error) {
    console.error('Error uploading generated image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
} 