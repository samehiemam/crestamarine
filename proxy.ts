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
  const accept = _request.headers.get("accept") ?? "";
  const isFlightRequest =
    _request.headers.get("rsc") === "1" ||
    accept.includes("text/x-component") ||
    _request.headers.has("next-router-state-tree") ||
    !accept.includes("text/html");

  if (
    isFlightRequest &&
    _request.nextUrl.pathname !== "/document-recovery.html"
  ) {
    const recoveryUrl = new URL("/document-recovery.html", _request.url);
    recoveryUrl.searchParams.set(
      "path",
      `${_request.nextUrl.pathname}${_request.nextUrl.search}${_request.nextUrl.hash}`,
    );

    const redirect = NextResponse.redirect(recoveryUrl, 307);
    redirect.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    redirect.headers.set("CDN-Cache-Control", "no-store");
    redirect.headers.set("Surrogate-Control", "no-store");
    redirect.headers.set("X-LiteSpeed-Cache-Control", "no-cache");
    return redirect;
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
