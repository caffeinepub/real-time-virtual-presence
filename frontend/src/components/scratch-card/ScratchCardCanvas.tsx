import React from 'react';
import { useScratchCard } from '@/hooks/useScratchCard';
import { Button } from '@/components/ui/button';
import { Play, Volume2 } from 'lucide-react';

interface ScratchCardCanvasProps {
  photoUrl: string;
  audioUrl?: string;
}

export default function ScratchCardCanvas({ photoUrl, audioUrl }: ScratchCardCanvasProps) {
  const {
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
    hasAudio,
  } = useScratchCard({ photoUrl, audioUrl });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-border">
        {/* Background photo */}
        <img
          src={photoUrl}
          alt="Hidden memory"
          className="w-full h-auto block"
          style={{ display: 'block' }}
        />
        {/* Scratch overlay canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Scratch to reveal</span>
          <span>{scratchPercent}% revealed</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${scratchPercent}%` }}
          />
        </div>
      </div>

      {/* Audio reveal */}
      {isRevealed && hasAudio && (
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <p className="text-sm text-muted-foreground">🎵 A message is waiting for you!</p>
          <Button onClick={playAudio} className="gap-2">
            <Play className="w-4 h-4" />
            Play Audio Message
          </Button>
        </div>
      )}

      {isRevealed && !hasAudio && (
        <p className="text-accent font-semibold animate-fade-in">
          ✨ Memory fully revealed!
        </p>
      )}
    </div>
  );
}
