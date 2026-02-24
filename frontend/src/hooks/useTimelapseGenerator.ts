import { useState, useCallback, useEffect } from 'react';
import type { Photo } from '../backend';

interface TimelapseOptions {
  frameDuration?: number; // seconds per photo
  fps?: number;
}

export function useTimelapseGenerator(photos: Photo[], options: TimelapseOptions = {}) {
  const { frameDuration = 0.75, fps = 30 } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [shouldGenerate, setShouldGenerate] = useState(false);

  const generateTimelapse = useCallback(async () => {
    if (photos.length < 3) {
      console.warn('Need at least 3 photos to generate timelapse');
      return null;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load all images
      const images: HTMLImageElement[] = [];
      for (let i = 0; i < photos.length; i++) {
        const img = new Image();
        const url = photos[i].photoBlob.getDirectURL();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        images.push(img);
        setProgress((i + 1) / photos.length * 0.5); // First 50% for loading
      }

      // Create video using MediaRecorder
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });

      mediaRecorder.start();

      // Render frames
      const framesPerPhoto = Math.floor(frameDuration * fps);
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Calculate scaling to fit canvas while maintaining aspect ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Hold frame for duration
        await new Promise((resolve) => setTimeout(resolve, frameDuration * 1000));
        
        setProgress(0.5 + (i + 1) / images.length * 0.5); // Last 50% for rendering
      }

      mediaRecorder.stop();
      const blob = await recordingPromise;
      
      setVideoBlob(blob);
      setProgress(1);
      return blob;
    } catch (error) {
      console.error('Timelapse generation error:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [photos, frameDuration, fps]);

  // Auto-generate when we have 3+ photos
  useEffect(() => {
    if (photos.length >= 3 && !videoBlob && !isGenerating && shouldGenerate) {
      generateTimelapse();
      setShouldGenerate(false);
    }
  }, [photos.length, videoBlob, isGenerating, shouldGenerate, generateTimelapse]);

  const triggerGeneration = useCallback(() => {
    setShouldGenerate(true);
  }, []);

  const downloadTimelapse = useCallback(() => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `timelapse-${timestamp}.webm`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [videoBlob]);

  return {
    generateTimelapse,
    triggerGeneration,
    downloadTimelapse,
    isGenerating,
    progress,
    videoBlob,
    canGenerate: photos.length >= 3,
  };
}
