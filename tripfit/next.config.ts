import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TripFit lives inside an unrelated Git worktree that has its own lockfile.
  // Pinning the root prevents Turbopack from watching or resolving the parent app.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
