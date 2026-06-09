/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for Docker (ignored by Vercel).
  output: "standalone",
  // z3-solver ships a .wasm binary; keep it external so Next doesn't try to bundle it.
  experimental: {
    serverComponentsExternalPackages: ["z3-solver"],
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
