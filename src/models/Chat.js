import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  messages: [{
    role: {
      type: String,
      required: true,
      enum: ['user', 'model', 'assistant'],
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [{
      url: { type: String, required: true },
      type: { type: String, required: true },
      displayName: { type: String, required: true },
      size: { type: Number },
      category: { type: String },
      geminiFile: { type: Object } // For storing Gemini file processing info
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    user: {
      name: String,
      email: String,
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for efficient querying
chatSchema.index({ userId: 1, updatedAt: -1 });

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Note: Title generation is now handled by the LLM in the API route

// Clear the model cache to ensure schema updates are applied
if (mongoose.models.Chat) {
  delete mongoose.models.Chat;
}

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 