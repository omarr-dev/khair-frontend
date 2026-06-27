// Sentry initialization for the Edge runtime (middleware, edge routes).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://fe60d3e13b10ce61090ada7ae361f7ab@o4511467721261056.ingest.de.sentry.io/4511637632254032",
  tracesSampleRate: 0.1,
  debug: false,
});
