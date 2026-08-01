function validDocumentPath(path: string) {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/api/") &&
    !path.startsWith("/_next/")
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const path = String(form.get("path") ?? "");

  if (!validDocumentPath(path)) {
    return new Response("Invalid document path", { status: 400 });
  }

  const target = new URL(path, "https://crestamarine.invalid");
  target.searchParams.set(
    "__html",
    `hostinger-20260801-v4-${Date.now().toString(36)}`,
  );

  return new Response(null, {
    status: 303,
    headers: {
      Location: `${target.pathname}${target.search}${target.hash}`,
      "Cache-Control": "no-store",
    },
  });
}
