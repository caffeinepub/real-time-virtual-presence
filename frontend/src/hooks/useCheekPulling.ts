import { useState, useCallback, useRef } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface DeformationData {
  centerX: number;
  centerY: number;
  intensity: number;
  radius: number;
}

export function useCheekPulling() {
  const [isActive, setIsActive] = useState(false);
  const [deformation, setDeformation] = useState<DeformationData | null>(null);
  const touchStartRef = useRef<TouchPoint | null>(null);
  const lastTouchRef = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    const touchPoint: TouchPoint = {
      x: ((point.clientX - rect.left) / rect.width) * 100,
      y: ((point.clientY - rect.top) / rect.height) * 100,
      timestamp: Date.now(),
    };

    touchStartRef.current = touchPoint;
    lastTouchRef.current = touchPoint;
    setIsActive(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current || !lastTouchRef.current) return;

    const point = 'touches' in e ? e.touches[0] : e;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const currentPoint: TouchPoint = {
      x: ((point.clientX - rect.left) / rect.width) * 100,
      y: ((point.clientY - rect.top) / rect.height) * 100,
      timestamp: Date.now(),
    };

    const deltaX = currentPoint.x - touchStartRef.current.x;
    const deltaY = currentPoint.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate intensity based on drag distance
    const intensity = Math.min(distance / 20, 1);

    setDeformation({
      centerX: currentPoint.x,
      centerY: currentPoint.y,
      intensity,
      radius: 15 + intensity * 10,
    });

    lastTouchRef.current = currentPoint;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
    setDeformation(null);
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setDeformation(null);
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, []);

  return {
    isActive,
    deformation,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleTouchStart,
      onMouseMove: handleTouchMove,
      onMouseUp: handleTouchEnd,
      onMouseLeave: handleTouchEnd,
    },
    reset,
  };
}
