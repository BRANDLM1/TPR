import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this package. Next.js otherwise infers it by
  // walking up for lockfiles, and any stray package-lock.json in a parent
  // directory (a developer's home folder, for example) silently wins — which
  // changes what gets bundled into build traces. Pinning it makes the build
  // reproducible on any machine.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
