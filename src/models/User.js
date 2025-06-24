import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    image: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    hasSubscribed: {
      type: Boolean,
      default: false,
      required: true,
    },
    hasInterests:{
      type: Boolean,
      default: false,
    },
    interests: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

// Ensure unique email per company if needed later, for now, global unique email for users
// UserSchema.index({ email: 1, companyId: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model("User", UserSchema); 