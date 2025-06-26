import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { decryptBuffer } from "@/lib/crypto";
import { verifyToken } from "@/lib/authMiddleware";

import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const user = verifyToken(req);
  if (!user || typeof user === "string" || !user.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string")
    return res.status(400).json({ message: "Missing file ID" });

  await connectToDB();

  const fileDoc = await File.findById(id);
  if (!fileDoc) return res.status(404).json({ message: "File not found" });

  if (fileDoc.owner.toString() !== user.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const filePath = path.join(process.cwd(), "uploads", fileDoc.storedName);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "File missing on server" });

  const encrypted = fs.readFileSync(filePath);
  const decrypted = decryptBuffer(encrypted, fileDoc.iv);

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileDoc.originalName}"`
  );
  res.status(200).send(decrypted);
}
