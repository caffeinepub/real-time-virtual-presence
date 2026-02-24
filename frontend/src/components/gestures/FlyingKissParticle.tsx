interface KissParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
}

interface FlyingKissParticleProps {
  particles: KissParticle[];
}

export default function FlyingKissParticle({ particles }: FlyingKissParticleProps) {
  return (
    <>
      {particles.map((particle) => {
        const currentX = particle.startX + (particle.endX - particle.startX) * particle.progress;
        const currentY = particle.startY + (particle.endY - particle.startY) * particle.progress;
        const scale = 0.5 + particle.progress * 0.5;

        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: 'none',
            }}
          >
            <div className="text-4xl animate-pulse">💋</div>
          </div>
        );
      })}
    </>
  );
}
