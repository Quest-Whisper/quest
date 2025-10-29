import mongoose from "mongoose";

const MlModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
      minlength: [3, "Model name must be at least 3 characters long"],
      maxlength: [100, "Model name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    datasetRequirements: {
      type: String,
      trim: true,
      maxlength: [1000, "Dataset requirements cannot exceed 1000 characters"],
      default: "",
    },
    targetAccuracy: {
      type: Number,
      min: [0.1, "Target accuracy must be at least 0.1"],
      max: [1.0, "Target accuracy cannot exceed 1.0"],
      default: 0.85,
    },
    modelType: {
      type: String,
      required: [true, "Model type is required"],
      enum: ['classification', 'detection', 'segmentation', 'custom', 'transfer-learning'],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ['medical', 'agriculture', 'technology', 'vision'],
    },
    modelId: {
      type: String,
      required: [true, "Model ID is required"],
      unique: true,
      minlength: [5, "Model ID must be at least 5 characters long"],
    },
    teamMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    input_shape: {
      type: [Number],
      default: [224, 224, 3],
    },
    output_units: {
      type: Number,
    },
    epochs: {
      type: Number,
      default: 10,
      min: [1, "Epochs must be at least 1"],
      max: [100, "Epochs cannot exceed 100"],
    },
    batchSize: {
      type: Number,
      default: 32,
      min: [1, "Batch size must be at least 1"],
      max: [128, "Batch size cannot exceed 128"],
    },
    config: {
      base_model: {
        type: String,
        default: 'resnet50',
      },
      use_attention: {
        type: Boolean,
        default: false,
      },
      use_data_augmentation: {
        type: Boolean,
        default: true,
      },
      dropout_rate: {
        type: Number,
        default: 0.2,
        min: [0, "Dropout rate must be at least 0"],
        max: [1, "Dropout rate cannot exceed 1"],
      },
      fine_tune_layers: {
        type: Number,
        default: 10,
        min: [0, "Fine tune layers must be at least 0"],
      },
      learning_rate: {
        type: Number,
        default: 0.0001,
        min: [0.000001, "Learning rate must be at least 0.000001"],
        max: [1, "Learning rate cannot exceed 1"],
      },
    },
    status: {
      type: String,
      enum: ['created', 'setting_up', 'training', 'completed', 'failed'],
      default: 'created',
    },
    training: {
      started: {
        type: Boolean,
        default: false,
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      currentEpoch: {
        type: Number,
        default: 0,
      },
      totalEpochs: {
        type: Number,
        default: 10,
      },
      accuracy: {
        type: Number,
        default: null,
      },
      loss: {
        type: Number,
        default: null,
      },
      logs: [{
        epoch: Number,
        accuracy: Number,
        loss: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    dataset: {
      uploaded: {
        type: Boolean,
        default: false,
      },
      totalSamples: {
        type: Number,
        default: 0,
      },
      classes: [{
        id: Number,
        name: String,
        sampleCount: {
          type: Number,
          default: 0,
        },
      }],
      uploadedAt: {
        type: Date,
        default: null,
      },
      datasetPath: {
        type: String,
        default: null,
      },
    },
    createdBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
MlModelSchema.index({ ownerId: 1, updatedAt: -1 });
MlModelSchema.index({ modelId: 1 }, { unique: true });
MlModelSchema.index({ status: 1, createdAt: -1 });
MlModelSchema.index({ category: 1, modelType: 1 });

// Pre-save middleware to validate modelId uniqueness
MlModelSchema.pre('save', async function(next) {
  if (this.isModified('modelId')) {
    const existingModel = await this.constructor.findOne({ 
      modelId: this.modelId,
      _id: { $ne: this._id }
    });
    if (existingModel) {
      throw new Error('Model ID already exists');
    }
  }
  next();
});

// Instance method to set up training
MlModelSchema.methods.setUpTraining = function() {
  this.status = 'setting_up';
  return this.save();
};

// Instance method to start training
MlModelSchema.methods.startTraining = function() {
  this.status = 'training';
  this.training.started = true;
  this.training.startedAt = new Date();
  this.training.currentEpoch = 0;
  this.training.totalEpochs = this.epochs;
  return this.save();
};

// Instance method to complete training
MlModelSchema.methods.completeTraining = function(accuracy, loss) {
  this.status = 'completed';
  this.training.completedAt = new Date();
  this.training.accuracy = accuracy;
  this.training.loss = loss;
  return this.save();
};

// Instance method to fail training
MlModelSchema.methods.failTraining = function() {
  this.status = 'failed';
  this.training.completedAt = new Date();
  return this.save();
};

// Static method to get models by user
MlModelSchema.statics.findByUser = function(userId) {
  return this.find({ ownerId: userId }).sort({ updatedAt: -1 });
};

// Static method to get models by status
MlModelSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

export default mongoose.models.MlModel || mongoose.model("MlModel", MlModelSchema); 