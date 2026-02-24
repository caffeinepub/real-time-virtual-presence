import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X } from 'lucide-react';

interface CountdownTimerProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function CountdownTimer({ onComplete, onCancel }: CountdownTimerProps) {
  const [duration, setDuration] = useState<3 | 5 | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  const startCountdown = (seconds: 3 | 5) => {
    setDuration(seconds);
    setCountdown(seconds);
  };

  const handleCancel = () => {
    setCountdown(null);
    setDuration(null);
    onCancel();
  };

  if (countdown !== null && countdown >= 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="absolute -top-16 right-0 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="text-white text-[200px] font-bold leading-none animate-pulse">
            {countdown === 0 ? '📸' : countdown}
          </div>
        </div>
      </div>
    );
  }

  if (duration === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="p-8 max-w-md">
          <h3 className="text-2xl font-bold mb-4 text-center">Choose Timer Duration</h3>
          <p className="text-muted-foreground mb-6 text-center">
            Select how long before the photo is captured
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => startCountdown(3)}
              size="lg"
              className="flex-1 text-lg h-20"
            >
              3 Seconds
            </Button>
            <Button
              onClick={() => startCountdown(5)}
              size="lg"
              className="flex-1 text-lg h-20"
            >
              5 Seconds
            </Button>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full mt-4"
          >
            Cancel
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
