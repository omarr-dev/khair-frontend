import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Suppress SDK build logs except in CI.
  silent: !process.env.CI,

  // Upload a wider set of source maps for better stack traces.
  widenClientFileUpload: true,

  // Strip Sentry SDK logger statements to reduce bundle size.
  disableLogger: true,

  // Source-map upload only runs when SENTRY_ORG, SENTRY_PROJECT and
  // SENTRY_AUTH_TOKEN are set at build time (e.g. in your CI/Railway env).
  // Without them the build still works; you just get minified stack traces.
});
