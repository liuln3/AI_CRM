/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    serverActions: { bodySizeLimit: "5mb" }
  }
};

export default nextConfig;
