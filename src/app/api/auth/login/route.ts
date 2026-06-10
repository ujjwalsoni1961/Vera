import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  checkCredentials,
  createSessionToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  // Small constant delay to blunt credential probing.
  await new Promise((r) => setTimeout(r, 350));

  if (!checkCredentials(email, password)) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
