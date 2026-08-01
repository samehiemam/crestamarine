import type { NextConfig } from "next";

const documentVaryHeaders = [
  "RSC",
  "Next-Router-State-Tree",
  "Next-Router-Prefetch",
  "Next-Router-Segment-Prefetch",
  "Accept-Encoding",
].join(", ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Surrogate-Control", value: "no-store" },
          { key: "X-LiteSpeed-Cache-Control", value: "no-cache" },
          { key: "Vary", value: documentVaryHeaders },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
