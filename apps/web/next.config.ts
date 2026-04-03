import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared"],
  async rewrites() {
    return [
      // git.exposed/owner/repo → internal /r/owner/repo
      // Exclude known routes: api, badge, r, _next, opengraph-image, twitter-image, favicon, signin, settings
      {
        source: '/:owner((?!api|badge|r|_next|opengraph-image|twitter-image|favicon|signin|settings)\\w[\\w.-]*)/:repo([\\w.-]+)',
        destination: '/r/:owner/:repo',
      },
      // Also handle GitHub-style deep paths: owner/repo/tree/main/src → owner/repo
      {
        source: '/:owner((?!api|badge|r|_next|opengraph-image|twitter-image|favicon|signin|settings)\\w[\\w.-]*)/:repo([\\w.-]+)/:rest*',
        destination: '/r/:owner/:repo',
      },
    ];
  },
};

export default nextConfig;
