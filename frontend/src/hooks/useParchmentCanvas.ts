import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useHowlerAudio } from './useHowlerAudio';

declare global {
  interface Window {
    Atrament?: new (canvas: HTMLCanvasElement, options?: { width?: number; height?: number; color?: string; weight?: number }) => {
      clear: () => void;
      mode: string;
    };
  }
}

interface UseParchmentCanvasReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isAtramentLoaded: boolean;
  timeRemaining: number;
  isSealed: boolean;
  clearCanvas: () => void;
  saveCanvas: () => void;
}

const TIMER_DURATION = 120; // 2 minutes in seconds

export function useParchmentCanvas(): UseParchmentCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const atramentRef = useRef<{ clear: () => void; mode: string } | null>(null);
  const [isAtramentLoaded, setIsAtramentLoaded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [isSealed, setIsSealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasDrawnRef = useRef(false);
  const { playPaperRustle, playWaxCrack } = useHowlerAudio();

  // Load Atrament.js from CDN
  useEffect(() => {
    if (window.Atrament) {
      setIsAtramentLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/atrament/dist/atrament.min.js';
    script.async = true;
    script.onload = () => setIsAtramentLoaded(true);
    script.onerror = () => console.warn('[Atrament] Failed to load from CDN');
    document.head.appendChild(script);
  }, []);

  // Initialize Atrament on canvas when loaded
  useEffect(() => {
    if (!isAtramentLoaded || !canvasRef.current || atramentRef.current) return;
    if (!window.Atrament) return;

    try {
      atramentRef.current = new window.Atrament(canvasRef.current, {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        color: '#3d1a00',
        weight: 3,
      });
    } catch (e) {
      console.warn('[Atrament] Initialization error:', e);
    }
  }, [isAtramentLoaded]);

  // Attach draw start listener for paper rustle sound
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDrawStart = () => {
      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        playPaperRustle();
      }
    };

    canvas.addEventListener('mousedown', handleDrawStart);
    canvas.addEventListener('touchstart', handleDrawStart);

    return () => {
      canvas.removeEventListener('mousedown', handleDrawStart);
      canvas.removeEventListener('touchstart', handleDrawStart);
    };
  }, [playPaperRustle]);

  // Countdown timer
  useEffect(() => {
    if (isSealed) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsSealed(true);
          // Disable drawing
          if (atramentRef.current) {
            try {
              atramentRef.current.mode = 'disabled';
            } catch {
              // mode may not be settable in all versions
            }
          }
          playWaxCrack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSealed, playWaxCrack]);

  const clearCanvas = useCallback(() => {
    if (isSealed) return;
    if (atramentRef.current) {
      atramentRef.current.clear();
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    hasDrawnRef.current = false;
  }, [isSealed]);

  const saveCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `parchment-letter-${Date.now()}.png`;
    a.click();
  }, []);

  return { canvasRef, isAtramentLoaded, timeRemaining, isSealed, clearCanvas, saveCanvas };
}
