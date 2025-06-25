import { connectToDB } from "@/lib/db";
import File from "@/models/File";
import { encryptBuffer } from "@/lib/crypto";
import { verifyToken } from "@/lib/authMiddleware";

import fs from "fs";
import path from "path";
import multer from "multer";
import { promisify } from "util";

const upload = multer({ storage: multer.memoryStorage() });
const runMiddleware = promisify(upload.single("file"));

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  await runMiddleware(req, res); // multer runs here
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  await connectToDB();

  const fileBuffer = req.file.buffer;
  const { encrypted, iv } = encryptBuffer(fileBuffer);

  const storedName = `${Date.now()}-${req.file.originalname}`;
  const filePath = path.join(process.cwd(), "uploads", storedName);
  fs.writeFileSync(filePath, encrypted);

  const fileDoc = await File.create({
    originalName: req.file.originalname,
    storedName,
    iv,
    owner: user.userId,
    size: req.file.size,
  });

  res.status(201).json({ message: "File uploaded", fileId: fileDoc._id });
}
