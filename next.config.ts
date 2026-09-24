import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site has zero next/image usage — photos are static WebP tiers under
  // public/, so skip the (paid, quota-limited) Vercel image optimizer.
  images: { unoptimized: true },
};

export default nextConfig;
