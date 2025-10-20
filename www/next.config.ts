import type { NextConfig } from "next";

console.log(__dirname);
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
