// File: src/app/api/file/delete/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { deleteFileFromContainer } from "@/lib/sftp";

export async function DELETE(request: Request) {
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
      console.log(`Legacy file detected, using constructed path: ${containerPath}`);
    }

    // 6) Delete file from container first
    try {
      console.log(`Deleting file from container: ${containerPath}`);
      await deleteFileFromContainer(containerPath);
      console.log(`File successfully deleted from container: ${containerPath}`);
    } catch (containerError) {
      console.error("Failed to delete file from container:", containerError);
      
      // Check if it's a "file not found" error in container
      if (containerError instanceof Error && 
          (containerError.message.includes("No such file") || 
           containerError.message.includes("not found") ||
           containerError.message.includes("ENOENT"))) {
        console.log("File not found in container, proceeding with database cleanup");
        // Continue with database deletion - file might have been manually removed
      } else {
        // For other errors, we might want to halt the process
        return NextResponse.json(
          { 
            message: "Failed to delete file from secure storage", 
            error: containerError 
          },
          { status: 503 }
        );
      }
    }

    // 7) Delete file record from database
    await File.findByIdAndDelete(id);
    console.log(`File record deleted from database: ${id}`);

    // 8) Return success response
    return NextResponse.json(
      { 
        message: "File deleted successfully",
        fileId: id,
        originalName: fileDoc.originalName 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("File deletion error:", error);

    // Determine appropriate error response
    if (error instanceof Error) {
      if (error.message.includes("SFTP") || error.message.includes("container")) {
        return NextResponse.json(
          { message: "Failed to access secure storage", error: error.message },
          { status: 503 }
        );
      } else if (error.message.includes("Cast to ObjectId failed")) {
        return NextResponse.json(
          { message: "Invalid file ID format" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        message: "File deletion failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}