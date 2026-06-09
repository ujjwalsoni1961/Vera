/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for Docker (ignored by Vercel).
  output: "standalone",
  // z3-solver ships a .wasm binary; keep it external so Next doesn't try to bundle it.
  experimental: {
    serverComponentsExternalPackages: ["z3-solver"],
    // Ensure the z3 WASM binary + worker are bundled into the serverless
    // function so the solver can initialise in production (not just locally).
    outputFileTracingIncludes: {
      "/api/run": ["./node_modules/z3-solver/build/**"],
    },
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
