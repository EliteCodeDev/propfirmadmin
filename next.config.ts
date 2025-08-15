import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fundedhero.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'neocapitalfunding.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'minio.zevenglobalfunding.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
