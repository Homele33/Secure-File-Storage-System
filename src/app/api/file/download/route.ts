import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { decryptBuffer } from "@/lib/crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(request: Request) {
  // 1) Auth
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

  // 2) Parse file ID
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id)
    return NextResponse.json({ message: "Missing file ID" }, { status: 400 });

  // 3) Connect & fetch metadata
  await connectToDB();
  const fileDoc = await File.findById(id);
  if (!fileDoc)
    return NextResponse.json({ message: "File not found" }, { status: 404 });

  // 4) Ownership check
  if (fileDoc.owner.toString() !== decoded.userId) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  // 5) Read & decrypt
  const filePath = path.join(process.cwd(), "uploads", fileDoc.storedName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { message: "File missing on server" },
      { status: 404 }
    );
  }
  const encrypted = fs.readFileSync(filePath);
  const decrypted = decryptBuffer(encrypted, fileDoc.iv);

  // 6) Return binary response
  return new NextResponse(decrypted, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileDoc.originalName}"`,
    },
  });
}
