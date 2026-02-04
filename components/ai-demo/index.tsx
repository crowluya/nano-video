"use client";

/**
 * AI Demo page - Currently disabled
 * All demo endpoints have been removed for production security
 */
export default function AIDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h2 className="text-3xl font-bold">AI Demo Page</h2>
        <p className="text-muted-foreground">
          This page is currently unavailable. Please use the main features:
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <a
            href="/video-generation"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Video Generation
          </a>
          <a
            href="/prompt-generator"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Prompt Generator
          </a>
        </div>
      </div>
    </div>
  );
}
