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
      ];
    },
};

export default nextConfig;
