/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth?mode=signin",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/auth?mode=signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
