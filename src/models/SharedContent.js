import mongoose from 'mongoose';

const sharedContentSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  sources: [{
    title: String,
    url: String,
    image: String,
  }],
  displayImage: {
    type: String,
    default: null,
  },
  sharedBy: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for efficient querying
sharedContentSchema.index({ shareId: 1 });
sharedContentSchema.index({ 'sharedBy.userId': 1, createdAt: -1 });
sharedContentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
sharedContentSchema.index({ isActive: 1, createdAt: -1 });

// Update the updatedAt field before saving
sharedContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the model
const SharedContent = mongoose.models.SharedContent || mongoose.model('SharedContent', sharedContentSchema);

export default SharedContent; 