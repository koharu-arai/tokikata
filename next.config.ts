import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint は未導入なので、ビルド時のチェックは TypeScript の型チェックだけにしています
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
