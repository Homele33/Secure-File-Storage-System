import jwt, { JwtPayload } from "jsonwebtoken";
import { NextApiRequest } from "next";

export function verifyToken(
  req: NextApiRequest
): (JwtPayload & { userId: string }) | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      userId: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export default verifyToken;
