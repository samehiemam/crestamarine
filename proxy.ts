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
  const isRecoveryFetch =
    _request.headers.get("x-cresta-document-recovery") === "1";
  const isFlightRequest =
    !accept.includes("text/html") ||
    (_request.nextUrl.searchParams.has("__document") && !isRecoveryFetch);

  if (
    isFlightRequest &&
    _request.nextUrl.pathname !== "/document-recovery.html"
  ) {
    const documentUrl = new URL("/document-recovery.html", _request.url);
    documentUrl.searchParams.set(
      "path",
      `${_request.nextUrl.pathname}${_request.nextUrl.search}`,
    );

    const redirect = NextResponse.redirect(documentUrl, 307);
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
