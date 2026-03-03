import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { EmployeeSession } from "@/types";

const COOKIE_NAME = "employee-session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createEmployeeSession(
  employeeId: string,
  employeeName: string
) {
  const token = await new SignJWT({
    employeeId,
    employeeName,
  } satisfies Omit<EmployeeSession, "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .setIssuedAt()
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });

  return token;
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EmployeeSession;
  } catch {
    return null;
  }
}

export async function verifyEmployeeToken(
  token: string
): Promise<EmployeeSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EmployeeSession;
  } catch {
    return null;
  }
}

export async function destroyEmployeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
