// Sentry initialization for the browser. This file runs on the client.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://fe60d3e13b10ce61090ada7ae361f7ab@o4511467721261056.ingest.de.sentry.io/4511637632254032",

  // Performance tracing sample rate (0.0 - 1.0). 10% of transactions.
  tracesSampleRate: 0.1,

  // Only emit SDK debug logs in development.
  debug: false,
});

// Captures navigation (App Router route changes) for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
