import type { NextRequest } from "next/server";

export function publicOrigin(request: NextRequest) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return new URL(configured).origin;

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();

  if (forwardedHost) {
    return `${forwardedProtocol || "https"}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}
