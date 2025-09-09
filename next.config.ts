import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fundedhero.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "neocapitalfunding.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "minio.zevenglobalfunding.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "minio.elitecode.lat",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.propfirm.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
