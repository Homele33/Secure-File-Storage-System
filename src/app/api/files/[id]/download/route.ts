import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { EncryptionService } from '@/lib/encryption';
import { SSHTransferService } from '@/lib/ssh-transfer';
import File from '@/models/File';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sshService: SSHTransferService | null = null;
  let tempPath: string | null = null;

  try {
    // Authenticate user
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find file and verify ownership
    const file = await File.findById(params.id);
    if (!file || file.isDeleted || file.uploadedBy.toString() !== user.id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Download from backend via SSH
    sshService = new SSHTransferService();
    await sshService.connect();
    
    const remotePath = path.join(process.env.UPLOAD_DIR!, file.encryptedName);
    tempPath = path.join(os.tmpdir(), `download-${file.encryptedName}`);
    
    await sshService.downloadFile(remotePath, tempPath);

    // Read encrypted file
    const encryptedBuffer = await fs.readFile(tempPath);
    
    // Decrypt file
    const iv = Buffer.from(file.encryptionIV, 'hex');
    const authTag = Buffer.from(file.authTag, 'hex');
    
    const decrypted = EncryptionService.decrypt(encryptedBuffer, iv, authTag);

    // Verify file integrity
    const currentChecksum = EncryptionService.generateHash(decrypted);
    if (currentChecksum !== file.checksum) {
      throw new Error('File integrity check failed');
    }

    // Update last accessed time
    file.lastAccessed = new Date();
    await file.save();

    return new NextResponse(decrypted, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': decrypted.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Download failed' 
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