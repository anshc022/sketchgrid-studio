import type { NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Konva uses the 'canvas' package in Node, which isn't available.
      // Since we only use Konva client-side, we can alias it to an empty module.
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        canvas: false,
      };
    }
    return config;
  },
};
export default config;
