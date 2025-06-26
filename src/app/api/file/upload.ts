// File: src/app/api/file/upload/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { encryptBuffer } from "@/lib/crypto";

export const config = {
  api: {
    bodyParser: false, // disable Next’s default JSON parser
  },
};

export async function POST(request: Request) {
  // 1) Authenticate
  const auth = request.headers.get("authorization");
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const token = auth.split(" ")[1];
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
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  // 3) Convert to Buffer
  const arrayBuf = await fileField.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  // 4) Encrypt
  const { encrypted, iv } = encryptBuffer(buffer);

  // 5) Persist to disk
  const originalName = (fileField as any).name || "unnamed";
  const storedName = `${Date.now()}-${originalName}`;
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  fs.writeFileSync(path.join(uploadDir, storedName), encrypted);

  // 6) Save metadata in MongoDB
  await connectToDB();
  const fileDoc = await File.create({
    originalName,
    storedName,
    iv,
    owner: decoded.userId,
    size: buffer.length,
  });

  // 7) Return JSON response
  return NextResponse.json(
    { message: "File uploaded", fileId: fileDoc._id },
    { status: 201 }
  );
}
