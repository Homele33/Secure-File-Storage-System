// File: src/app/api/file/list/route.ts
import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";

export const config = {
  api: {
    // bodyParser isn’t needed for GET
    bodyParser: false,
  },
};

export async function GET(request: Request) {
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

  // 2) Connect to MongoDB
  await connectToDB();

  // 3) Fetch files for this user
  const files = await File.find({ owner: decoded.userId })
    .select("-__v")
    .sort({ createdAt: -1 })
    .lean();

  // 4) Return JSON response
  return NextResponse.json({ files }, { status: 200 });
}
