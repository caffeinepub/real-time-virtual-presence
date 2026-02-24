import { useRef, useState, useCallback, useEffect } from 'react';

interface UseScratchCardOptions {
  photoUrl: string;
  audioUrl?: string;
  revealThreshold?: number;
}

export function useScratchCard({ photoUrl, audioUrl, revealThreshold = 60 }: UseScratchCardOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
    }
  }, [audioUrl]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = '/assets/generated/scratch-card-foil.dim_800x600.png';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
    } else {
      ctx.arc(x, y, 20, 0, Math.PI * 2);
    }
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    lastPos.current = { x, y };

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    const total = canvas.width * canvas.height;
    const pct = Math.round((transparent / total) * 100);
    setScratchPercent(pct);
    if (pct >= revealThreshold && !isRevealed) {
      setIsRevealed(true);
    }
  }, [isRevealed, revealThreshold]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e.nativeEvent, canvas);
    scratch(pos.x, pos.y);
  }, [scratch]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e.nativeEvent, canvas);
    scratch(pos.x, pos.y);
  }, [isDrawing, scratch]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e.nativeEvent, canvas);
    scratch(pos.x, pos.y);
  }, [scratch]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e.nativeEvent, canvas);
    scratch(pos.x, pos.y);
  }, [isDrawing, scratch]);

  const handleTouchEnd = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const playAudio = useCallback(() => {
    audioRef.current?.play();
  }, []);

  return {
    canvasRef,
    scratchPercent,
    isRevealed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    playAudio,
    hasAudio: !!audioUrl,
  };
}
