import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

import { connectToDB } from "@/lib/db";
import File from "@/models/File";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function DELETE(request: Request) {
  // 1) Auth
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const token = auth.split(" ")[1];
  let decoded: JwtPayload & { userId: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { userId: string };
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2) Parse file ID from query string
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing file ID" }, { status: 400 });

  // 3) Connect & fetch
  await connectToDB();
  const fileDoc = await File.findById(id);
  if (!fileDoc) return NextResponse.json({ message: "File not found" }, { status: 404 });

  // 4) Ownership check
  if (fileDoc.owner.toString() !== decoded.userId) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  // 5) Delete on disk
  const filePath = path.join(process.cwd(), "uploads", fileDoc.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  // 6) Delete DB record
  await fileDoc.deleteOne();

  return NextResponse.json({ message: "File deleted" }, { status: 200 });
}
