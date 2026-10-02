import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint は未導入なので、ビルド時のチェックは TypeScript の型チェックだけにしています
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
