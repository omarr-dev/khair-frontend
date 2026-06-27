"use client";

// Catches unhandled errors in the React tree and reports them to Sentry.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <h2>حدث خطأ غير متوقع</h2>
      </body>
    </html>
  );
}
