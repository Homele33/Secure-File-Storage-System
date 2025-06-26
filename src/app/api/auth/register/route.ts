import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  await connectToDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { message: "Email already in use" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });

  return NextResponse.json(
    { message: "User created", userId: user._id },
    { status: 201 }
  );
}
