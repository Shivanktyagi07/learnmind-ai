import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
