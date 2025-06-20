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
};

export default nextConfig;
