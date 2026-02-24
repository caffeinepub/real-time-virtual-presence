import { RefObject, useState } from 'react';

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface UseARPhotoCaptureReturn {
  capturePhoto: () => Promise<ArrayBuffer | null>;
  isCapturing: boolean;
}

export function useARPhotoCapture(
  backgroundVideoRef: RefObject<HTMLVideoElement | null>,
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>,
  transform: Transform,
  shadowIntensity: number
): UseARPhotoCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePhoto = async (): Promise<ArrayBuffer | null> => {
    setIsCapturing(true);

    try {
      const backgroundVideo = backgroundVideoRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!backgroundVideo || !overlayCanvas) {
        console.error('Missing video or canvas elements');
        return null;
      }

      // Create a high-resolution capture canvas
      const captureCanvas = document.createElement('canvas');
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) return null;

      // Set high resolution (minimum 1920x1080)
      const width = Math.max(1920, backgroundVideo.videoWidth);
      const height = Math.max(1080, backgroundVideo.videoHeight);
      captureCanvas.width = width;
      captureCanvas.height = height;

      // Draw background (local camera feed)
      ctx.drawImage(backgroundVideo, 0, 0, width, height);

      // Calculate overlay position and size
      const overlayWidth = overlayCanvas.width * transform.scale;
      const overlayHeight = overlayCanvas.height * transform.scale;
      const overlayX = (width * transform.x) / 100;
      const overlayY = (height * transform.y) / 100;

      // Apply shadow effect
      if (shadowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = shadowIntensity * 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowIntensity;
      }

      // Draw overlay with transform
      ctx.save();
      ctx.translate(overlayX, overlayY);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.drawImage(overlayCanvas, -overlayWidth / 2, -overlayHeight / 2, overlayWidth, overlayHeight);
      ctx.restore();

      if (shadowIntensity > 0) {
        ctx.restore();
      }

      // Convert to blob
      return new Promise((resolve) => {
        captureCanvas.toBlob(
          (blob) => {
            if (blob) {
              blob.arrayBuffer().then((buffer) => {
                resolve(buffer);
              });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.9
        );
      });
    } catch (error) {
      console.error('Photo capture error:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  return { capturePhoto, isCapturing };
}
