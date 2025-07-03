// File: src/app/api/file/upload/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { encryptBuffer } from "@/lib/crypto";
import { uploadBufferToContainer, deleteFileFromContainer } from "@/lib/sftp";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false, // we'll handle multipart ourselves
  },
};

export async function POST(request: Request) {
  let containerPath: string | null = null;

  try {
    // 1) Authenticate
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: JwtPayload & { userId: string };

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
        userId: string;
      };
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse the multipart/form-data payload
    const formData = await request.formData();
    const fileField = formData.get("file");

    if (!(fileField instanceof Blob)) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // 3) Convert Blob to Buffer
    const arrayBuffer = await fileField.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4) Encrypt the file buffer
    const { encrypted, iv } = encryptBuffer(buffer);

    // 5) Generate file names and paths
    const originalName = (fileField as File).name || "unnamed";
    const storedName = crypto.createHash("sha256").update(`${Date.now()}-${originalName}`).digest("hex");
    containerPath = `/home/sftpuser/uploads/${storedName}`;

    // 6) Upload encrypted buffer directly to container via SFTP
    console.log(
      `Uploading encrypted file directly to container: ${containerPath}`
    );
    await uploadBufferToContainer(encrypted, containerPath);

    // 7) Save metadata in MongoDB (with container path)
    await connectToDB();
    const fileDoc = await File.create({
      originalName,
      storedName,
      containerPath,
      iv,
      owner: decoded.userId,
      size: buffer.length,
      uploadedAt: new Date(),
    });

    console.log(`File successfully uploaded and stored: ${fileDoc._id}`);

    // 8) Return success response
    return NextResponse.json(
      {
        message: "File uploaded and stored securely",
        fileId: fileDoc._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload error:", error);

    // Critical: Clean up file from container if database save failed
    if (containerPath) {
      try {
        console.log(
          `Attempting to clean up file from container: ${containerPath}`
        );
        await deleteFileFromContainer(containerPath);
        console.log(`Successfully cleaned up file from container after error`);
      } catch (cleanupError) {
        console.error(
          "Critical: Failed to clean up file from container:",
          cleanupError
        );
        // This is a critical error - file is orphaned in container
        // You might want to add this to a cleanup queue or alert system
      }
    }

    // Determine appropriate error response
    if (error instanceof Error) {
      if (
        error.message.includes("SFTP") ||
        error.message.includes("container")
      ) {
        return NextResponse.json(
          {
            message: "Failed to upload to secure storage",
            error: error.message,
          },
          { status: 503 } // Service Unavailable
        );
      } else if (
        error.message.includes("duplicate") ||
        error.message.includes("E11000")
      ) {
        return NextResponse.json(
          { message: "File with this name already exists" },
          { status: 409 } // Conflict
        );
      }
    }

    return NextResponse.json(
      {
        message: "File upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
