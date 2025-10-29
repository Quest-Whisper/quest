import mongoose from "mongoose";

const DatasetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modelId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: [true, "Dataset name is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    modelType: {
      type: String,
      required: true,
      enum: ['classification', 'detection', 'segmentation', 'custom', 'transfer-learning'],
    },
    classes: [{
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      images: [{
        id: {
          type: Number,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        storagePath: {
          type: String,
          required: true,
        },
        downloadURL: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        trainingLabel: {
          type: Number,
          required: true,
        }
      }]
    }],
    totalImages: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'training', 'completed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient querying
DatasetSchema.index({ userId: 1, updatedAt: -1 });

// Calculate total images before saving
DatasetSchema.pre('save', function(next) {
  this.totalImages = this.classes.reduce((total, cls) => total + cls.images.length, 0);
  next();
});

export default mongoose.models.Dataset || mongoose.model("Dataset", DatasetSchema); 