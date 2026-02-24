import { useEffect, useState } from 'react';

interface ShutterEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ShutterEffect({ trigger, onComplete }: ShutterEffectProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white pointer-events-none"
      style={{
        animation: 'shutterFlash 300ms ease-out',
      }}
    >
      <style>{`
        @keyframes shutterFlash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
