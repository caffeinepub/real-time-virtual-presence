import { useCheekPulling } from '../../hooks/useCheekPulling';

interface CheekPullingOverlayProps {
  enabled: boolean;
}

export default function CheekPullingOverlay({ enabled }: CheekPullingOverlayProps) {
  const { isActive, deformation, handlers } = useCheekPulling();

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 touch-none"
      style={{ pointerEvents: enabled ? 'auto' : 'none' }}
      {...handlers}
    >
      {isActive && deformation && (
        <div
          className="absolute rounded-full border-2 border-teal-400 bg-teal-400/20 pointer-events-none transition-all duration-100"
          style={{
            left: `${deformation.centerX}%`,
            top: `${deformation.centerY}%`,
            width: `${deformation.radius * 2}px`,
            height: `${deformation.radius * 2}px`,
            transform: 'translate(-50%, -50%)',
            opacity: deformation.intensity,
          }}
        />
      )}
      
      {enabled && !isActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
          👆 Drag to pull cheeks
        </div>
      )}
    </div>
  );
}
