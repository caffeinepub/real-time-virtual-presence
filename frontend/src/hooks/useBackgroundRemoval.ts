import { useEffect, useRef, useState, RefObject } from 'react';

interface UseBackgroundRemovalReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  error: string | null;
}

export function useBackgroundRemoval(videoRef: RefObject<HTMLVideoElement | null>): UseBackgroundRemovalReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const initializeVideoPassthrough = () => {
      // Since MediaPipe is not available in the package.json,
      // we'll use a simple passthrough that displays the video without background removal
      setError('Background removal not available - displaying video without processing');
      setIsLoading(false);

      if (mounted && canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const drawFrame = () => {
            if (!mounted || !videoRef.current || !canvasRef.current) return;
            
            const video = videoRef.current;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            animationFrameRef.current = requestAnimationFrame(drawFrame);
          };
          
          // Wait for video to be ready
          const checkVideoReady = setInterval(() => {
            if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
              clearInterval(checkVideoReady);
              drawFrame();
            }
          }, 100);

          return () => {
            clearInterval(checkVideoReady);
          };
        }
      }
    };

    initializeVideoPassthrough();

    return () => {
      mounted = false;
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef]);

  return { canvasRef, isLoading, error };
}
