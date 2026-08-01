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
export async function proxy(_request: NextRequest) {
  const accept = _request.headers.get("accept") ?? "";
  const recoverySourceMatch = _request.nextUrl.pathname.match(
    /^\/document-source\/[^/]+(\/.*)$/,
  );

  if (recoverySourceMatch) {
    const sourceUrl = new URL(_request.url);
    sourceUrl.pathname =
      recoverySourceMatch[1] === "/__root__" ? "/" : recoverySourceMatch[1];
    sourceUrl.searchParams.set(
      "__html_document",
      _request.nextUrl.pathname.split("/")[2] ?? Date.now().toString(36),
    );

    // Render the target through a separate, explicitly HTML request. Returning
    // that body here prevents Hostinger from reusing a flight response for the
    // browser document, even when it ignores rewrite request-header overrides.
    const documentHeaders = new Headers(_request.headers);
    [
      "rsc",
      "next-router-state-tree",
      "next-router-prefetch",
      "next-router-segment-prefetch",
      "next-url",
      "x-nextjs-data",
      "x-middleware-prefetch",
      "purpose",
      "host",
    ].forEach((header) => documentHeaders.delete(header));
    documentHeaders.set(
      "accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    );
    documentHeaders.set("sec-fetch-dest", "document");
    documentHeaders.set("x-cresta-html-document", "1");

    const documentResponse = await fetch(sourceUrl, {
      headers: documentHeaders,
      cache: "no-store",
      redirect: "follow",
    });
    const documentBody = await documentResponse.text();
    const documentType = documentResponse.headers.get("content-type") ?? "";
    const response = new NextResponse(documentBody, {
      status: documentResponse.status,
      headers: {
        "Content-Type": documentType.includes("text/html")
          ? documentType
          : "text/html; charset=utf-8",
      },
    });
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate",
    );
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("X-LiteSpeed-Cache-Control", "no-cache");
    response.headers.set("Vary", varyHeaders);
    return response;
  }

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
