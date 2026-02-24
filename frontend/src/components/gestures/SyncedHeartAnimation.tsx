import React, { useEffect, useState } from 'react';

interface SyncedHeartAnimationProps {
  isSynced: boolean;
  pulseRate?: number;
}

export default function SyncedHeartAnimation({ isSynced, pulseRate }: SyncedHeartAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isSynced) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSynced]);

  if (!visible) return null;

  const animationDuration = pulseRate && pulseRate > 0 ? `${60 / pulseRate}s` : '1s';

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
      <div
        className="text-6xl select-none"
        style={{
          animation: `pulse ${animationDuration} ease-in-out infinite`,
          filter: 'drop-shadow(0 0 20px rgba(255, 100, 100, 0.8))',
        }}
      >
        ❤️
      </div>
    </div>
  );
}
