import { NextRequest, NextResponse } from "next/server";
import { safeRelativeReturnPath, SESSION_COOKIE } from "../../../chatgpt-auth";

export async function GET(request: NextRequest) {
  const returnTo = safeRelativeReturnPath(request.nextUrl.searchParams.get("returnTo") ?? "/");
  const response = NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
