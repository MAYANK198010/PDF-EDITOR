/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/PDF-EDITOR" : "",
  images: { unoptimized: true },
  experimental: { serverComponentsExternalPackages: ["pdf-lib"] }
};

export default nextConfig;
