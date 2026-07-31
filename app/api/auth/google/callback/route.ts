import { NextRequest, NextResponse } from "next/server";
import { createSession, safeRelativeReturnPath, SESSION_COOKIE } from "../../../../chatgpt-auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  let oauth: { state: string; returnTo: string } | null = null;
  try { oauth = JSON.parse(request.cookies.get("cresta_oauth")?.value ?? "null"); } catch {}
  if (!code || !state || !oauth || state !== oauth.state) {
    return NextResponse.json({ error: "Invalid sign-in response" }, { status: 400 });
  }
  const callback = `${request.nextUrl.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", redirect_uri: callback, grant_type: "authorization_code" }),
  });
  if (!tokenResponse.ok) return NextResponse.json({ error: "Google sign-in failed" }, { status: 502 });
  const token = await tokenResponse.json() as { access_token: string };
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return NextResponse.json({ error: "Unable to read Google profile" }, { status: 502 });
  const profile = await profileResponse.json() as { email?: string; name?: string; email_verified?: boolean };
  if (!profile.email || profile.email_verified === false) return NextResponse.json({ error: "A verified email is required" }, { status: 403 });
  const response = NextResponse.redirect(new URL(safeRelativeReturnPath(oauth.returnTo), request.nextUrl.origin));
  response.cookies.set(SESSION_COOKIE, createSession({ email: profile.email.toLowerCase(), fullName: profile.name ?? null, displayName: profile.name ?? profile.email }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/",
  });
  response.cookies.delete("cresta_oauth");
  return response;
}
