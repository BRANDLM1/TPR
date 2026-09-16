import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this package. Next.js otherwise infers it by
  // walking up for lockfiles, and any stray package-lock.json in a parent
  // directory (a developer's home folder, for example) silently wins — which
  // changes what gets bundled into build traces. Pinning it makes the build
  // reproducible on any machine.
  outputFileTracingRoot: path.join(__dirname),

  images: {
    // This app renders every image with a plain <img> — there is no `next/image`
    // anywhere in app/. Next still exposes /_next/image by default, which decodes
    // whatever it is handed through sharp → libvips/libheif, the component that
    // carries the standing CVEs `npm audit` reports against sharp. Turning
    // optimization off closes an endpoint nothing here uses.
    //
    // If someone later adopts <Image>, remove this line and add `remotePatterns`
    // for the hosts that serve MediaItem.source.
    unoptimized: true,
  },
};

export default nextConfig;
