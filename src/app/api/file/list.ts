import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { verifyToken } from "@/lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const user = verifyToken(req);
  if (!user || typeof user === "string" || !user.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await connectToDB();

  const files = await File.find({ owner: user.userId })
    .select("-__v")
    .sort({ createdAt: -1 });

  res.status(200).json({ files });
}
