import { useState, useCallback } from 'react';

// TODO: Replace setTimeout with a POST request to InVideo AI API endpoint for photo-to-video automation,
// using VITE_INVIDEO_API_KEY for authentication.
// Poll for video generation completion and return the download link.
const INVIDEO_API_KEY = import.meta.env.VITE_INVIDEO_API_KEY as string | undefined;

export function useInVideoBlooper() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const createBlooperVideo = useCallback(async (photos: (string | Blob)[]): Promise<string> => {
    setIsProcessing(true);
    setResultMessage(null);
    try {
      // TODO: Replace with actual InVideo AI API call:
      // const response = await fetch('https://api.invideo.io/v1/generate', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${INVIDEO_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ photos: [...], style: 'blooper' }),
      // });
      console.log('[InVideo] Creating blooper video with', photos.length, 'photos. API Key:', INVIDEO_API_KEY ? '(set)' : '(not set)');
      await new Promise((r) => setTimeout(r, 3000));
      const msg = 'Your blooper video is being generated — check back shortly.';
      setResultMessage(msg);
      return msg;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetResult = useCallback(() => setResultMessage(null), []);

  return { createBlooperVideo, isProcessing, resultMessage, resetResult };
}
