'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-destructive">Oops!</h1>
      <h2 className="mb-2 text-2xl font-semibold">Something Went Wrong</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        {error.message || 'An unexpected error occurred. We\'ve been notified and are looking into it.'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Try Again
      </button>
    </main>
  );
}

