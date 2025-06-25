import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import File from '@/models/File';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's files (not deleted)
    const files = await File.find({
      uploadedBy: user.id,
      isDeleted: false,
    })
    .select('-encryptionIV -authTag -checksum -encryptedName')
    .sort({ uploadedAt: -1 });

    return NextResponse.json({
      files,
      total: files.length,
    });

  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}