/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... you might have other configurations here
  
  experimental: {
    outputFileTracingIncludes: {
      // This tells Vercel to include the specified files for this specific API route
      '/api/generate-invoice': ['./node_modules/@sparticuz/chromium/bin/**'],
    },
  },
};

module.exports = nextConfig;