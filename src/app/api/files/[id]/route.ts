import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { SSHTransferService } from '@/lib/ssh-transfer';
import File from '@/models/File';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let sshService: SSHTransferService | null = null;

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

    // Delete from backend via SSH
    sshService = new SSHTransferService();
    await sshService.connect();
    
    const remotePath = path.join(process.env.UPLOAD_DIR!, file.encryptedName);
    await sshService.deleteFile(remotePath);

    // Mark as deleted in database (soft delete)
    file.isDeleted = true;
    await file.save();

    return NextResponse.json({
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    );
  } finally {
    // Cleanup
    if (sshService) {
      sshService.disconnect();
    }
  }
}