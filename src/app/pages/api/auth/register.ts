import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  await connectToDB();

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });

  res.status(201).json({ message: "User created", userId: user._id });
}
