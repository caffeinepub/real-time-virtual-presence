interface LipMark {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

interface LipMarkOverlayProps {
  lipMarks: LipMark[];
}

export default function LipMarkOverlay({ lipMarks }: LipMarkOverlayProps) {
  return (
    <>
      {lipMarks.map((mark) => {
        const age = Date.now() - mark.timestamp;
        const opacity = Math.max(0, 1 - age / 5000);

        return (
          <div
            key={mark.id}
            className="absolute pointer-events-none"
            style={{
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path
                d="M20 25 Q15 20, 10 22 Q8 23, 10 25 Q15 28, 20 26 Q25 28, 30 25 Q32 23, 30 22 Q25 20, 20 25"
                fill="rgba(255, 105, 180, 0.6)"
                stroke="rgba(255, 105, 180, 0.8)"
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      })}
    </>
  );
}
