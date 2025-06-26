import User from "@/models/User";
import { connectToDB } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") return NextResponse.json({ status: 405 });

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  await connectToDB();

  const user = await User.findOne({ email });
  if (!user)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "2h",
  });

  return NextResponse.json({ token }, { status: 200 });
}
