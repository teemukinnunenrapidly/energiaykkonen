'use client';

import { Suspense } from 'react';
import { CardSystemContainer } from '@/components/card-system/CardSystemContainer';

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#0d9430',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '0 16px',
        boxSizing: 'border-box',
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <CardSystemContainer showVisualSupport={true} />
      </Suspense>
    </div>
  );
}
