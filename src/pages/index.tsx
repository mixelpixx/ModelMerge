import React from 'react';
import Head from 'next/head';
import ModelMerger from '@/components/ModelMerger';

export default function Home() {
  return (
    <>
      <Head>
        <title>Model Merger Tool</title>
        <meta name="description" content="AI Model Merger Interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
              AI Model Merger
            </h1>
          </div>

          {/* Main content */}
          <div className="px-4 sm:px-0">
            <ModelMerger />
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>
              Built with Next.js and Tailwind CSS
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

// Add types for page properties if needed
Home.getInitialProps = async () => {
  return {
    // Add any initial props here
  };
};