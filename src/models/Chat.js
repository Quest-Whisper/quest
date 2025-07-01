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

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat; 