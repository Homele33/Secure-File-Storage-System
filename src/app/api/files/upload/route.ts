import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { EncryptionService } from '@/lib/encryption';
import { SSHTransferService } from '@/lib/ssh-transfer';
import File from '@/models/File';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let sshService: SSHTransferService | null = null;
  let tempPath: string | null = null;

  try {
    // Authenticate user
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file not allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate file checksum before encryption
    const checksum = EncryptionService.generateHash(buffer);

    // Encrypt file
    const { encrypted, iv, authTag } = EncryptionService.encrypt(buffer);

    // Generate unique encrypted filename
    const encryptedName = EncryptionService.generateSecureFilename();
    tempPath = path.join(os.tmpdir(), encryptedName);

    // Save encrypted file temporarily
    await fs.writeFile(tempPath, encrypted);

    // Transfer to backend via SSH
    sshService = new SSHTransferService();
    await sshService.connect();
    
    const remotePath = path.join(process.env.UPLOAD_DIR!, encryptedName);
    await sshService.uploadFile(tempPath, remotePath);

    // Save file metadata to database
    const fileDoc = await File.create({
      originalName: file.name,
      encryptedName,
      size: file.size,
      mimeType: file.type,
      uploadedBy: user.id,
      checksum,
      encryptionIV: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileId: fileDoc._id,
      originalName: file.name,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  } finally {
    // Cleanup
    if (sshService) {
      sshService.disconnect();
    }
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
}