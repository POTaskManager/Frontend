'use client';

import { useEffect } from 'react';

// Global flag for MSW readiness
let isMswReady = false;

export function useMswReady() {
  return isMswReady;
}

export function MswProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting MSW...');
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass'
        }).then(() => {
          console.log('MSW started successfully');
          isMswReady = true;
        });
      });
    } else {
      isMswReady = true;
    }
  }, []);

  return null;
}


