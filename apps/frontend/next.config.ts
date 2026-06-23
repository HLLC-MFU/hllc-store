import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Allow LAN access for mobile testing (pnpm dev --hostname 0.0.0.0)
  allowedDevOrigins: ["172.25.43.90"],
  devIndicators: false,
  output: "standalone",
  experimental: {},
  async rewrites() {
    return [
      { source: "/api/backend/:path*", destination: `${BACKEND_URL}/api/backend/:path*` },
      { source: "/api/upload", destination: `${BACKEND_URL}/api/upload` },
      { source: "/api/send-email", destination: `${BACKEND_URL}/api/send-email` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // CSP only in production — dev mode needs loose connect-src for HMR WebSocket
    if (!isDev) {
      securityHeaders.push({
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      });
    }

    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
