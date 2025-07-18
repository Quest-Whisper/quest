/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "*", // Allow images from all domains
          },
        ],
        unoptimized: true, // Disable image optimization for static images
      },
    // Firebase App Hosting optimizations
    experimental: {
      serverComponentsExternalPackages: ["@google/genai"],
    },
    // Ensure proper streaming for Firebase
    async headers() {
      return [
        {
          source: "/api/chat/tts",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
            {
              key: "X-Accel-Buffering",
              value: "no",
            },
          ],
        },
        {
          source: "/api/og-image",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
            },
            {
              key: "Content-Type",
              value: "image/png",
            },
          ],
        },
        // SEO and performance headers
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-XSS-Protection",
              value: "1; mode=block",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
          ],
        },
        // Cache static assets
        {
          source: "/(.*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      ];
    },
};

export default nextConfig;
