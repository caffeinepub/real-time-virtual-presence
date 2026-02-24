import { useState } from 'react';

const CLIPDROP_API_KEY = import.meta.env.VITE_CLIPDROP_API_KEY as string | undefined;

export function usePhotoRelight() {
  const [isRelighting, setIsRelighting] = useState(false);

  const relightPhoto = async (photoBlob: Blob): Promise<Blob> => {
    setIsRelighting(true);
    try {
      if (!CLIPDROP_API_KEY) {
        throw new Error('Clipdrop API key not configured');
      }

      const formData = new FormData();
      formData.append('image_file', photoBlob, 'photo.jpg');

      const res = await fetch('https://clipdrop-api.co/relight/v1', {
        method: 'POST',
        headers: {
          'x-api-key': CLIPDROP_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Clipdrop Relight API error: ${res.statusText}`);
      }

      return await res.blob();
    } catch (err) {
      console.warn('Clipdrop Relight failed:', err);
      throw err;
    } finally {
      setIsRelighting(false);
    }
  };

  return { relightPhoto, isRelighting };
}
