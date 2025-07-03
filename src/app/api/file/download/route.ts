// File: src/app/api/file/download/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { decryptBuffer } from "@/lib/crypto";
import { downloadFileFromContainer } from "@/lib/sftp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(request: Request) {
  let tempFilePath: string | null = null;

  try {
    // 1) Auth
    const auth = request.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    let decoded: JwtPayload & { userId: string };

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
        userId: string;
      };
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse file ID
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Missing file ID" }, { status: 400 });
    }

    // 3) Connect & fetch metadata
    await connectToDB();
    const fileDoc = await File.findById(id);
    if (!fileDoc) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    // 4) Ownership check
    if (fileDoc.owner.toString() !== decoded.userId) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // 5) Determine container path (handle legacy files)
    let containerPath = fileDoc.containerPath;
    if (!containerPath) {
      // Legacy file - construct path from storedName
      containerPath = `/home/sftpuser/uploads/${fileDoc.storedName}`;
      console.log(
        `Legacy file detected, using constructed path: ${containerPath}`
      );

      // Optionally update the database record for future use
      try {
        await File.findByIdAndUpdate(id, { containerPath });
        console.log(`Updated legacy file with containerPath: ${id}`);
      } catch (updateError) {
        console.warn(
          `Failed to update legacy file with containerPath:`,
          updateError
        );
        // Continue anyway - this is just an optimization
      }
    }

    // 6) Download file from container to temporary location
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a unique temporary file name
    const tempFileName = `temp-${Date.now()}-${fileDoc.storedName}`;
    tempFilePath = path.join(tempDir, tempFileName);

    console.log(
      `Downloading file from container: ${containerPath} -> ${tempFilePath}`
    );

    // Download file from container via SFTP
    await downloadFileFromContainer(containerPath, tempFilePath);

    // 7) Read & decrypt the downloaded file
    if (!fs.existsSync(tempFilePath)) {
      return NextResponse.json(
        { message: "Failed to download file from secure storage" },
        { status: 500 }
      );
    }

    const encrypted = fs.readFileSync(tempFilePath);
    const decrypted = decryptBuffer(encrypted, fileDoc.iv);

    // 8) Clean up temporary file immediately after reading
    try {
      fs.unlinkSync(tempFilePath);
      console.log(`Temporary file deleted: ${tempFilePath}`);
      tempFilePath = null; // Mark as cleaned up
    } catch (cleanupError) {
      console.error("Error deleting temporary file:", cleanupError);
      // Continue anyway since we have the decrypted data
    }

    // 9) Return binary response
    return new NextResponse(decrypted, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileDoc.originalName}"`,
        "Content-Length": decrypted.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("File download error:", error);

    // Clean up temporary file if it exists and there was an error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`Cleaned up temporary file after error: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError);
      }
    }

    // Determine appropriate error response
    if (error instanceof Error) {
      if (
        error.message.includes("SFTP") ||
        error.message.includes("container")
      ) {
        return NextResponse.json(
          { message: "Failed to access secure storage", error: error.message },
          { status: 503 } // Service Unavailable
        );
      } else if (error.message.includes("decrypt")) {
        return NextResponse.json(
          { message: "File decryption failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "File download failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
