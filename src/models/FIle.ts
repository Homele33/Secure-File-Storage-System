import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  encryptedName: string;
  size: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  lastAccessed: Date;
  isDeleted: boolean;
  checksum: string;
  encryptionIV: string;
  authTag: string;
}

const FileSchema = new Schema<IFile>({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
  },
  encryptedName: {
    type: String,
    required: [true, 'Encrypted filename is required'],
    unique: true,
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader reference is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  checksum: {
    type: String,
    required: [true, 'File checksum is required'],
  },
  encryptionIV: {
    type: String,
    required: [true, 'Encryption IV is required'],
  },
  authTag: {
    type: String,
    required: [true, 'Authentication tag is required'],
  },
});

// Index for faster queries
FileSchema.index({ uploadedBy: 1, isDeleted: 1 });
FileSchema.index({ encryptedName: 1 });

export default mongoose.models.File || mongoose.model<IFile>('File', FileSchema);