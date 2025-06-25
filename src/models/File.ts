import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    originalName: String,
    storedName: String,
    iv: String, // base64
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    size: Number,
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", FileSchema);
