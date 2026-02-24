import { useState, useEffect, useCallback, useRef } from 'react';

// TODO: Replace placeholder base64 clips with real audio asset URLs:
// /assets/audio/paper-rustle.mp3 and /assets/audio/wax-crack.mp3

// Short silent WAV stub (0.1s, 8-bit, 8kHz mono) as base64
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

declare global {
  interface Window {
    Howl?: new (options: { src: string[]; volume?: number }) => { play: () => void };
    Howler?: unknown;
  }
}

export function useHowlerAudio() {
  const [isHowlerLoaded, setIsHowlerLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || window.Howl) {
      setIsHowlerLoaded(true);
      return;
    }
    loadedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/howler/dist/howler.min.js';
    script.async = true;
    script.onload = () => setIsHowlerLoaded(true);
    script.onerror = () => console.warn('[Howler] Failed to load Howler.js from CDN');
    document.head.appendChild(script);

    return () => {
      // Don't remove — other components may use it
    };
  }, []);

  const playPaperRustle = useCallback(() => {
    if (!window.Howl) return;
    try {
      // TODO: Replace SILENT_WAV_BASE64 with real audio: /assets/audio/paper-rustle.mp3
      new window.Howl({ src: [SILENT_WAV_BASE64], volume: 0.5 }).play();
    } catch (e) {
      console.warn('[Howler] playPaperRustle error:', e);
    }
  }, []);

  const playWaxCrack = useCallback(() => {
    if (!window.Howl) return;
    try {
      // TODO: Replace SILENT_WAV_BASE64 with real audio: /assets/audio/wax-crack.mp3
      new window.Howl({ src: [SILENT_WAV_BASE64], volume: 0.5 }).play();
    } catch (e) {
      console.warn('[Howler] playWaxCrack error:', e);
    }
  }, []);

  return { playPaperRustle, playWaxCrack, isHowlerLoaded };
}
