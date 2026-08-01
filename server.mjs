import { createServer } from "node:http";
import next from "next";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

const internalPath = /^(?:\/_next\/|\/api\/|\/images\/|\/brochures\/)/;
const publicFile = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|pdf|css|js|map|woff2?)$/i;
const flightHeaders = [
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
  "next-url",
  "x-nextjs-data",
  "x-middleware-prefetch",
  "purpose",
];

await app.prepare();

createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const isPageRequest =
    (request.method === "GET" || request.method === "HEAD") &&
    !internalPath.test(pathname) &&
    !publicFile.test(pathname);

  if (isPageRequest) {
    for (const header of flightHeaders) {
      delete request.headers[header];
    }
    request.headers.accept =
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    request.headers["sec-fetch-dest"] = "document";
  }

  handle(request, response);
}).listen(port, hostname, () => {
  console.log(`Cresta Marine listening on http://${hostname}:${port}`);
});
