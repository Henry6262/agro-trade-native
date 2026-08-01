import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The landing app is deployed from its own lockfile and directory. Pinning
  // the tracing root avoids Next.js selecting the monorepo lockfile by guess.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
