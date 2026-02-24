import { useState, useCallback } from 'react';

// TODO: Replace setTimeout with a POST request to https://api.shotstack.io/stage/render
// with the photo URLs and music template, using VITE_SHOTSTACK_API_KEY as x-api-key header.
// Poll for render completion and return the video download link.
const SHOTSTACK_API_KEY = import.meta.env.VITE_SHOTSTACK_API_KEY as string | undefined;

export function useShotstackReel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const createTrendingReel = useCallback(async (photos: (string | Blob)[]): Promise<string> => {
    setIsProcessing(true);
    setResultMessage(null);
    try {
      // TODO: Replace with actual Shotstack API call:
      // const response = await fetch('https://api.shotstack.io/stage/render', {
      //   method: 'POST',
      //   headers: {
      //     'x-api-key': SHOTSTACK_API_KEY || '',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ timeline: { ... }, output: { format: 'mp4' } }),
      // });
      console.log('[Shotstack] Creating trending reel with', photos.length, 'photos. API Key:', SHOTSTACK_API_KEY ? '(set)' : '(not set)');
      await new Promise((r) => setTimeout(r, 3000));
      const msg = 'Your reel is being processed by Shotstack — you will receive a download link shortly.';
      setResultMessage(msg);
      return msg;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetResult = useCallback(() => setResultMessage(null), []);

  return { createTrendingReel, isProcessing, resultMessage, resetResult };
}
