import { useEffect, useRef, useState } from 'react';
import { useCamera } from '../../camera/useCamera';
import { Button } from '../ui/button';
import { X, Camera, Grid3x3, Maximize2, Minimize2, RotateCw, Loader2, Hand, Heart, Smile, Sparkles, PersonStanding, PenLine } from 'lucide-react';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import PerspectiveGrid from './PerspectiveGrid';
import CameraErrorDisplay from '../CameraErrorDisplay';
import { useBackgroundRemoval } from '../../hooks/useBackgroundRemoval';
import { useARPhotoCapture } from '../../hooks/useARPhotoCapture';
import { useTakePhoto } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import CheekPullingOverlay from '../gestures/CheekPullingOverlay';
import { useFlyingKiss } from '../../hooks/useFlyingKiss';
import FlyingKissParticle from '../gestures/FlyingKissParticle';
import LipMarkOverlay from '../gestures/LipMarkOverlay';
import HeartbeatSyncUI from '../gestures/HeartbeatSyncUI';
import SyncedHeartAnimation from '../gestures/SyncedHeartAnimation';
import { useSnapCameraKit } from '../../hooks/useSnapCameraKit';
import { useMediaPipeBodyTracking } from '../../hooks/useMediaPipeBodyTracking';
import ParchmentLetterModal from '../shared-room/ParchmentLetterModal';

interface VideoAROverlayProps {
  roomId: string;
  onPhotoCapture: () => void;
  onExit: () => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type Preset = {
  name: string;
  transform: Transform;
};

const PRESETS: Preset[] = [
  { name: 'Standing Next to Me', transform: { x: 50, y: 60, scale: 1.0, rotation: 0 } },
  { name: 'Sitting on Chair', transform: { x: 50, y: 40, scale: 0.7, rotation: 0 } },
  { name: 'Far Away', transform: { x: 50, y: 30, scale: 0.4, rotation: 0 } },
];

type GestureMode = 'none' | 'cheek' | 'kiss' | 'heartbeat';

export default function VideoAROverlay({ roomId, onPhotoCapture, onExit }: VideoAROverlayProps) {
  const {
    isActive: cameraActive,
    isSupported: cameraSupported,
    error: cameraError,
    isLoading: cameraLoading,
    startCamera,
    stopCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment', width: 1920, height: 1080 });

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState<Transform>({ x: 50, y: 50, scale: 0.8, rotation: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [shadowIntensity, setShadowIntensity] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);
  const [gestureMode, setGestureMode] = useState<GestureMode>('none');
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  const { canvasRef: bgRemovalCanvasRef, isLoading: bgRemovalLoading } = useBackgroundRemoval(remoteVideoRef);
  const { capturePhoto, isCapturing } = useARPhotoCapture(videoRef, bgRemovalCanvasRef, transform, shadowIntensity);
  const takePhotoMutation = useTakePhoto();

  const { isListening, particles, lipMarks, startListening, stopListening } = useFlyingKiss();

  // Snap Camera Kit
  const { snapEffectsEnabled, toggleSnapEffects, applyLens } = useSnapCameraKit();

  // MediaPipe Body Tracking
  const { bodyTrackingEnabled, toggleBodyTracking, skeletonJoints, skeletonConnections } = useMediaPipeBodyTracking();

  // Start the environment camera via useCamera hook (no competing getUserMedia calls)
  useEffect(() => {
    if (cameraSupported && !cameraActive && !cameraLoading) {
      startCamera();
    }
  }, [cameraSupported, cameraActive, cameraLoading, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
      // Stop any remote video stream
      if (remoteVideoRef.current?.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach a simulated remote stream only after the main camera is active
  // Use a separate effect that runs only once when cameraActive first becomes true
  const remoteStreamStarted = useRef(false);
  useEffect(() => {
    if (!cameraActive || remoteStreamStarted.current) return;
    remoteStreamStarted.current = true;

    let mounted = true;
    // Reuse the environment camera stream for the remote preview simulation
    // to avoid a second competing getUserMedia call
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
      .then((stream) => {
        if (remoteVideoRef.current && mounted) {
          remoteVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        // Non-fatal: remote preview is a simulation, not required for core AR functionality
        console.warn('Remote preview stream unavailable:', err);
      });

    return () => {
      mounted = false;
    };
  }, [cameraActive]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gestureMode !== 'none') return;
    if (e.target === overlayContainerRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || gestureMode !== 'none') return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const containerWidth = overlayContainerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = overlayContainerRef.current?.clientHeight || window.innerHeight;

    setTransform((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(100, prev.x + (deltaX / containerWidth) * 100)),
      y: Math.max(0, Math.min(100, prev.y + (deltaY / containerHeight) * 100)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const applyPreset = (preset: Preset) => {
    setTransform(preset.transform);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const handleCapture = async () => {
    try {
      const photoBlob = await capturePhoto();
      if (!photoBlob) {
        toast.error('Failed to capture photo');
        return;
      }

      const externalBlob = ExternalBlob.fromBytes(new Uint8Array(photoBlob));
      await takePhotoMutation.mutateAsync({ roomId, blob: externalBlob });
      toast.success('Photo captured!');
      onPhotoCapture();
    } catch (error) {
      console.error('Photo capture error:', error);
      toast.error('Failed to save photo');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const success = await retry();
      if (!success) {
        toast.error('Failed to access camera. Please check your permissions.');
      }
    } catch (err) {
      console.error('Retry error:', err);
      toast.error('Failed to retry camera access');
    } finally {
      setIsRetrying(false);
    }
  };

  const toggleGestureMode = (mode: GestureMode) => {
    if (gestureMode === mode) {
      setGestureMode('none');
      if (mode === 'kiss') stopListening();
    } else {
      setGestureMode(mode);
      if (mode === 'kiss') {
        startListening();
        if (snapEffectsEnabled) applyLens('flying-kiss');
      }
      if (mode === 'cheek' && snapEffectsEnabled) {
        applyLens('cheek-pull');
      }
    }
  };

  if (cameraSupported === false) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <CameraErrorDisplay
            error={{ type: 'not-supported', message: 'Camera not supported' }}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
          <div className="flex justify-center">
            <Button onClick={onExit} variant="outline">Exit AR Session</Button>
          </div>
        </div>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <CameraErrorDisplay
            error={cameraError}
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
          <div className="flex justify-center">
            <Button onClick={onExit} variant="outline">Exit AR Session</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!cameraActive || cameraLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-teal-500" />
          <p className="text-muted-foreground">Initializing AR session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {showGrid && <PerspectiveGrid />}

      {/* Body tracking skeleton overlay */}
      {bodyTrackingEnabled && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg viewBox="0 0 1 1" className="w-full h-full absolute inset-0">
            {skeletonConnections.map(([a, b], i) => (
              <line
                key={i}
                x1={skeletonJoints[a].x}
                y1={skeletonJoints[a].y}
                x2={skeletonJoints[b].x}
                y2={skeletonJoints[b].y}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="0.006"
              />
            ))}
            {skeletonJoints.map((joint, i) => (
              <circle
                key={i}
                cx={joint.x}
                cy={joint.y}
                r="0.015"
                fill={joint.color}
                stroke="white"
                strokeWidth="0.003"
              />
            ))}
          </svg>
          <div className="absolute bottom-32 left-0 right-0 flex justify-center">
            <Badge className="bg-green-500/80 text-white text-sm px-4 py-1.5">
              📍 Stand Here — MediaPipe is tracking your position
            </Badge>
          </div>
        </div>
      )}

      <div ref={overlayContainerRef} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute pointer-events-auto cursor-move touch-none"
          style={{
            left: `${transform.x}%`,
            top: `${transform.y}%`,
            transform: `translate(-50%, -50%) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            className="relative rounded-lg overflow-hidden border-2 border-white/30"
            style={{
              width: '320px',
              height: '240px',
              filter: `drop-shadow(0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0,0,0,${shadowIntensity / 100}))`,
            }}
          >
            <canvas
              ref={bgRemovalCanvasRef}
              className="w-full h-full object-cover"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            <CheekPullingOverlay enabled={gestureMode === 'cheek'} />
          </div>
        </div>

        <FlyingKissParticle particles={particles} />
        <LipMarkOverlay lipMarks={lipMarks} />
        <SyncedHeartAnimation isSynced={false} />
      </div>

      {gestureMode === 'heartbeat' && (
        <div className="absolute top-4 right-4 z-20 w-64">
          <HeartbeatSyncUI videoRef={remoteVideoRef} />
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pointer-events-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex gap-2 justify-center flex-wrap">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  {preset.name}
                </Button>
              ))}
            </div>

            {/* Gesture controls */}
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => toggleGestureMode('cheek')}
                variant={gestureMode === 'cheek' ? 'default' : 'secondary'}
                size="sm"
                className={gestureMode === 'cheek' ? 'bg-teal-500' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
              >
                <Hand className="w-4 h-4 mr-2" />
                Cheek Pull
              </Button>
              <Button
                onClick={() => toggleGestureMode('kiss')}
                variant={gestureMode === 'kiss' ? 'default' : 'secondary'}
                size="sm"
                className={gestureMode === 'kiss' ? 'bg-teal-500' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
              >
                <Smile className="w-4 h-4 mr-2" />
                Flying Kiss
              </Button>
              <Button
                onClick={() => toggleGestureMode('heartbeat')}
                variant={gestureMode === 'heartbeat' ? 'default' : 'secondary'}
                size="sm"
                className={gestureMode === 'heartbeat' ? 'bg-teal-500' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
              >
                <Heart className="w-4 h-4 mr-2" />
                Heartbeat Sync
              </Button>
            </div>

            {/* Extra feature controls */}
            <div className="flex gap-2 justify-center flex-wrap">
              {/* Snap Effects toggle */}
              <Button
                onClick={toggleSnapEffects}
                variant={snapEffectsEnabled ? 'default' : 'secondary'}
                size="sm"
                className={snapEffectsEnabled ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Snap Effects
              </Button>
              {snapEffectsEnabled && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 self-center text-xs">
                  Snap Effects Active
                </Badge>
              )}

              {/* Body Tracking toggle */}
              <Button
                onClick={toggleBodyTracking}
                variant={bodyTrackingEnabled ? 'default' : 'secondary'}
                size="sm"
                className={bodyTrackingEnabled ? 'bg-green-500' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}
              >
                <PersonStanding className="w-4 h-4 mr-2" />
                Body Tracking
              </Button>

              {/* Write a Letter */}
              <Button
                onClick={() => setIsLetterModalOpen(true)}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <PenLine className="w-4 h-4 mr-2" />
                Write a Letter
              </Button>
            </div>

            <div className="bg-black/50 rounded-lg p-4 space-y-2">
              <Label className="text-white text-sm">Scale: {transform.scale.toFixed(2)}x</Label>
              <Slider
                value={[transform.scale]}
                onValueChange={([value]) => setTransform((prev) => ({ ...prev, scale: value }))}
                min={0.2}
                max={2}
                step={0.1}
              />
            </div>

            <div className="bg-black/50 rounded-lg p-4 space-y-2">
              <Label className="text-white text-sm">Rotation: {transform.rotation}°</Label>
              <Slider
                value={[transform.rotation]}
                onValueChange={([value]) => setTransform((prev) => ({ ...prev, rotation: value }))}
                min={-180}
                max={180}
                step={5}
              />
            </div>

            <div className="bg-black/50 rounded-lg p-4 space-y-2">
              <Label className="text-white text-sm">Shadow: {shadowIntensity}%</Label>
              <Slider
                value={[shadowIntensity]}
                onValueChange={([value]) => setShadowIntensity(value)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => setShowGrid(!showGrid)}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                {showGrid ? 'Hide' : 'Show'} Grid
              </Button>
              <Button
                onClick={() => setTransform((prev) => ({ ...prev, rotation: 0 }))}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset Rotation
              </Button>
              <Button
                onClick={() => setShowControls(false)}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Hide Controls
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showControls && (
        <Button
          onClick={() => setShowControls(true)}
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Show Controls
        </Button>
      )}

      <Button
        onClick={onExit}
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-white/20 z-50"
      >
        <X className="w-5 h-5" />
      </Button>

      <ParchmentLetterModal open={isLetterModalOpen} onOpenChange={setIsLetterModalOpen} />
    </div>
  );
}
