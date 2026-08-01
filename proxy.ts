import { type NextRequest, NextResponse } from "next/server";

const varyHeaders = [
  "RSC",
  "Next-Router-State-Tree",
  "Next-Router-Prefetch",
  "Next-Router-Segment-Prefetch",
  "Accept-Encoding",
].join(", ");

/**
 * Prevent a shared proxy or CDN from caching a React Server Components flight
 * response and later serving it as an HTML document.
 */
export function proxy(_request: NextRequest) {
  const sourceMatch = _request.nextUrl.pathname.match(
    /^\/document-source\/[^/]+(\/.*)$/,
  );
  if (sourceMatch) {
    const target = new URL(_request.url);
    target.pathname = sourceMatch[1] === "/__root__" ? "/" : sourceMatch[1];

    const response = NextResponse.rewrite(target);
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("X-LiteSpeed-Cache-Control", "no-cache");
    response.headers.set("Vary", varyHeaders);
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  const response = NextResponse.next();

  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate",
  );
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("X-LiteSpeed-Cache-Control", "no-cache");
  response.headers.set("Vary", varyHeaders);
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|brochures|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf)$).*)",
  ],
};
