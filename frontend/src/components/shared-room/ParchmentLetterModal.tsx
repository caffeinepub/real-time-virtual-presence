import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useParchmentCanvas } from '../../hooks/useParchmentCanvas';
import { Download, Trash2, Clock, Feather } from 'lucide-react';

interface ParchmentLetterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ParchmentLetterModal({ open, onOpenChange }: ParchmentLetterModalProps) {
  const { canvasRef, isAtramentLoaded, timeRemaining, isSealed, clearCanvas, saveCanvas } =
    useParchmentCanvas();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-[#f4e7d7] dark:bg-[#2a1a0a]">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#c8a87a]/40 bg-[#f4e7d7] dark:bg-[#2a1a0a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Feather className="w-5 h-5 text-[#8b5e3c]" />
              <DialogTitle className="text-[#3d1a00] dark:text-[#e8d4b8] font-serif text-lg">
                Write a Letter
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono font-medium ${
                  timeRemaining <= 30
                    ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                    : 'bg-[#c8a87a]/20 text-[#8b5e3c] dark:text-[#c8a87a]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
          {!isAtramentLoaded && (
            <p className="text-xs text-[#8b5e3c]/70 mt-1">Loading drawing engine…</p>
          )}
        </DialogHeader>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Parchment texture background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #f4e7d7 0%, #edd9b8 30%, #e8d4b8 60%, #dfc9a8 100%)',
            }}
          />
          {/* Subtle paper lines */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #c8a87a 27px, #c8a87a 28px)',
              backgroundPositionY: '40px',
            }}
          />

          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{
              touchAction: 'none',
              opacity: isSealed ? 0.7 : 1,
              pointerEvents: isSealed ? 'none' : 'auto',
            }}
          />

          {/* Sealed overlay */}
          {isSealed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-[#3d1a00]/80 backdrop-blur-sm rounded-2xl px-8 py-6 text-center shadow-2xl border border-[#c8a87a]/40">
                <div className="text-4xl mb-2">🕯️</div>
                <p className="text-[#f4e7d7] font-serif text-2xl font-bold">Letter Sealed!</p>
                <p className="text-[#c8a87a] text-sm mt-1">Your letter has been sealed with wax.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-[#c8a87a]/40 bg-[#f4e7d7] dark:bg-[#2a1a0a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={isSealed}
              className="border-[#c8a87a] text-[#8b5e3c] hover:bg-[#c8a87a]/20 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={saveCanvas}
              className="bg-[#8b5e3c] hover:bg-[#6b4a2e] text-[#f4e7d7] gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Save Letter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-[#8b5e3c] hover:bg-[#c8a87a]/20"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
