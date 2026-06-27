// Next.js instrumentation hook. Loads the correct Sentry config per runtime.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in React Server Components / server-side rendering.
export const onRequestError = Sentry.captureRequestError;
