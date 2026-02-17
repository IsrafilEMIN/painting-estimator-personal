/** @type {import('next').NextConfig} */
const sandboxSafeBuild = process.env.SANDBOX_SAFE_BUILD === "1";

const nextConfig = sandboxSafeBuild
  ? {
      experimental: {
        webpackBuildWorker: false,
      },
    }
  : {};

module.exports = nextConfig;
