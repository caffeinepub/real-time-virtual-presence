import { useState, useCallback } from 'react';
import { ExternalBlob } from '../backend';

interface UsePhotoCaptureOptions {
  minWidth?: number;
  minHeight?: number;
  quality?: number;
}

export function usePhotoCapture(options: UsePhotoCaptureOptions = {}) {
  const { minWidth = 1920, minHeight = 1080, quality = 0.95 } = options;
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFromCanvas = useCallback(
    async (canvas: HTMLCanvasElement): Promise<ExternalBlob | null> => {
      setIsCapturing(true);
      try {
        // Ensure minimum resolution
        const captureCanvas = document.createElement('canvas');
        const ctx = captureCanvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const targetWidth = Math.max(canvas.width, minWidth);
        const targetHeight = Math.max(canvas.height, minHeight);
        
        captureCanvas.width = targetWidth;
        captureCanvas.height = targetHeight;

        // Draw scaled image
        ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

        // Convert to blob
        const blob = await new Promise<Blob | null>((resolve) => {
          captureCanvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });

        if (!blob) throw new Error('Failed to create image blob');

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        return ExternalBlob.fromBytes(uint8Array);
      } catch (error) {
        console.error('Photo capture error:', error);
        return null;
      } finally {
        setIsCapturing(false);
      }
    },
    [minWidth, minHeight, quality]
  );

  const captureFromVideo = useCallback(
    async (video: HTMLVideoElement): Promise<ExternalBlob | null> => {
      setIsCapturing(true);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const targetWidth = Math.max(video.videoWidth, minWidth);
        const targetHeight = Math.max(video.videoHeight, minHeight);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });

        if (!blob) throw new Error('Failed to create image blob');

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        return ExternalBlob.fromBytes(uint8Array);
      } catch (error) {
        console.error('Photo capture error:', error);
        return null;
      } finally {
        setIsCapturing(false);
      }
    },
    [minWidth, minHeight, quality]
  );

  return {
    captureFromCanvas,
    captureFromVideo,
    isCapturing,
  };
}
