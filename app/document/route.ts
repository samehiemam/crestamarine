import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeDocumentPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;

  const url = new URL(value, "http://document.local");

  if (
    url.pathname === "/document" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export async function GET(request: NextRequest) {
  const documentPath = safeDocumentPath(
    request.nextUrl.searchParams.get("path"),
  );

  if (!documentPath) {
    return NextResponse.json({ error: "Invalid document path" }, { status: 400 });
  }

  const sourceUrl = new URL(documentPath, request.url);
  sourceUrl.searchParams.set("__document_relay", Date.now().toString(36));

  const source = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "X-Cresta-Document-Relay": "1",
    },
  });
  const contentType = source.headers.get("content-type") ?? "";

  if (!source.ok || !contentType.startsWith("text/html")) {
    return NextResponse.json(
      { error: "Unable to render document" },
      { status: 502 },
    );
  }

  const cleanPath = JSON.stringify(documentPath);
  const html = (await source.text()).replace(
    "<head>",
    `<head><script>window.history.replaceState(window.history.state,"",${cleanPath})</script>`,
  );

  return new NextResponse(html, {
    headers: {
      "Cache-Control":
        "private, no-cache, no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Surrogate-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-LiteSpeed-Cache-Control": "no-cache",
    },
  });
}
