'use client';

import { useEffect } from 'react';

export function MswProvider() {
  useEffect(() => {
    // MSW disabled - using real backend
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('Starting MSW');
    //   import('@/mocks/browser').then(({ worker }) => {
    //     worker.start({ onUnhandledRequest: 'bypass' });
    //   });
    // }
  }, []);
  return null;
}


