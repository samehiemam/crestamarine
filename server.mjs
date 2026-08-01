import { createServer } from "node:http";
import next from "next";

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

function isDocumentRoute(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const pathname = new URL(request.url || "/", "http://localhost").pathname;

  return !(
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/brochures/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

await app.prepare();

createServer((request, response) => {
  if (isDocumentRoute(request)) {
    // Hostinger's shared edge does not reliably vary RSC and HTML responses.
    // This site uses document links, so page routes intentionally serve only
    // HTML and can never seed the edge cache with a flight response.
    request.headers.accept =
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    delete request.headers.rsc;
    delete request.headers["next-router-state-tree"];
    delete request.headers["next-router-prefetch"];
    delete request.headers["next-router-segment-prefetch"];
  }

  handle(request, response);
}).listen(port, hostname, () => {
  console.log(`Cresta Marine is ready on http://${hostname}:${port}`);
});
