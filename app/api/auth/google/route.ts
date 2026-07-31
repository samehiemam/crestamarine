import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { safeRelativeReturnPath } from "../../../chatgpt-auth";
import { publicOrigin } from "../public-origin";

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 503 });
  }
  const state = randomBytes(24).toString("base64url");
  const returnTo = safeRelativeReturnPath(request.nextUrl.searchParams.get("returnTo") ?? "/my-cresta");
  const callback = `${publicOrigin(request)}/api/auth/google/callback`;
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  target.searchParams.set("redirect_uri", callback);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", "openid email profile");
  target.searchParams.set("state", state);
  target.searchParams.set("prompt", "select_account");
  const response = NextResponse.redirect(target);
  response.cookies.set("cresta_oauth", JSON.stringify({ state, returnTo }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/",
  });
  return response;
}
