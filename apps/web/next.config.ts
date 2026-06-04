import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "backend"],

  async rewrites() {
    return [
      {
        source: "/trpc/:path*",
        destination: "http://localhost:8788/trpc/:path*",
      },
      {
        source: "/copilotkit/:path*",
        destination: "http://localhost:8788/copilotkit/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8788/api/auth/:path*",
      },
    ]
  },
}

export default nextConfig
