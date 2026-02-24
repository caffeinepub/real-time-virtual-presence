import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Music2, Loader2, Sparkles, PersonStanding, PenLine } from 'lucide-react';
import Virtual3DEnvironment from './Virtual3DEnvironment';
import CountdownTimer from './CountdownTimer';
import ShutterEffect from './ShutterEffect';
import CheekPullingOverlay from '@/components/gestures/CheekPullingOverlay';
import FlyingKissParticle from '@/components/gestures/FlyingKissParticle';
import LipMarkOverlay from '@/components/gestures/LipMarkOverlay';
import HeartbeatSyncUI from '@/components/gestures/HeartbeatSyncUI';
import SyncedHeartAnimation from '@/components/gestures/SyncedHeartAnimation';
import SyncDanceTutorial from '@/components/gestures/SyncDanceTutorial';
import SyncDanceReview from '@/components/gestures/SyncDanceReview';
import ParchmentLetterModal from './ParchmentLetterModal';
import { useFlyingKiss } from '@/hooks/useFlyingKiss';
import { useSyncDanceRecording } from '@/hooks/useSyncDanceRecording';
import { usePhotoRelight } from '@/hooks/usePhotoRelight';
import { usePhotoBlending } from '@/hooks/usePhotoBlending';
import { useSnapCameraKit } from '@/hooks/useSnapCameraKit';
import { useMediaPipeBodyTracking } from '@/hooks/useMediaPipeBodyTracking';
import { toast } from 'sonner';

interface DualCameraViewProps {
  roomId: string;
  cameraAngle?: 'stage' | 'side' | 'group';
  onPhotoCapture?: (photoData: ArrayBuffer, photoUrl: string) => void;
  selectedAngle?: 'stage' | 'side' | 'group';
  onPhotoCaptured?: () => void;
  /** Pre-acquired stream from CameraPermissionGate — avoids a competing getUserMedia call */
  initialStream?: MediaStream | null;
}

export default function DualCameraView({
  roomId,
  cameraAngle,
  selectedAngle,
  onPhotoCapture,
  onPhotoCaptured,
  initialStream,
}: DualCameraViewProps) {
  const resolvedAngle = cameraAngle ?? selectedAngle ?? 'stage';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(initialStream ?? null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [shutterTrigger, setShutterTrigger] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [showSyncTutorial, setShowSyncTutorial] = useState(false);
  const [showDanceReview, setShowDanceReview] = useState(false);

  // Gesture hooks
  const { isListening, particles, lipMarks, startListening, stopListening } = useFlyingKiss();

  // Snap Camera Kit
  const { snapEffectsEnabled, toggleSnapEffects, applyLens } = useSnapCameraKit();

  // MediaPipe Body Tracking
  const { bodyTrackingEnabled, toggleBodyTracking, skeletonJoints, skeletonConnections } = useMediaPipeBodyTracking();

  // Sync Dance
  const {
    isRecording,
    countdown,
    result: danceResult,
    startRecording,
    reset: resetDance,
  } = useSyncDanceRecording();

  // Photo enhancement hooks
  const { relightPhoto, isRelighting } = usePhotoRelight();
  const { blendPhoto, isBlending } = usePhotoBlending();

  // Attach the initial stream to the video element immediately
  useEffect(() => {
    if (initialStream && localVideoRef.current) {
      localVideoRef.current.srcObject = initialStream;
      setLocalStream(initialStream);
    }
  }, [initialStream]);

  // Only call getUserMedia if no initialStream was provided (fallback)
  useEffect(() => {
    if (initialStream) return; // Already have a stream — don't compete

    let stream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
          audio: false,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera init failed:', err);
        toast.error('Could not access camera.');
      }
    };
    initCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [initialStream]);

  // Cleanup the initial stream on unmount (only if we own it via the fallback path)
  useEffect(() => {
    return () => {
      if (!initialStream && localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = localVideoRef.current;
    if (!canvas || !video) return;

    setIsCapturing(true);
    setShutterTrigger(true);
    setTimeout(() => setShutterTrigger(false), 400);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const rawBlob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.95)
      );

      setIsEnhancing(true);

      let processedBlob = rawBlob;
      try {
        processedBlob = await relightPhoto(rawBlob);
      } catch {
        toast.error('Lighting enhancement failed — using original photo.');
        processedBlob = rawBlob;
      }

      try {
        processedBlob = await blendPhoto(processedBlob);
      } catch {
        toast.error('Color blending failed — using unblended photo.');
      }

      setIsEnhancing(false);

      const arrayBuffer = await processedBlob.arrayBuffer();
      const url = URL.createObjectURL(processedBlob);

      if (onPhotoCapture) {
        onPhotoCapture(arrayBuffer, url);
      }
      if (onPhotoCaptured) {
        onPhotoCaptured();
      }
    } catch (err) {
      console.error('Capture failed:', err);
      toast.error('Photo capture failed.');
      setIsEnhancing(false);
    } finally {
      setIsCapturing(false);
    }
  }, [relightPhoto, blendPhoto, onPhotoCapture, onPhotoCaptured]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    handleCapture();
  }, [handleCapture]);

  const handleSyncDanceStart = () => {
    setShowSyncTutorial(false);
    startRecording(localStream, null);
  };

  useEffect(() => {
    if (danceResult) {
      setShowDanceReview(true);
    }
  }, [danceResult]);

  const handleFlyingKiss = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      if (snapEffectsEnabled) applyLens('flying-kiss');
    }
  };

  const isProcessing = isCapturing || isEnhancing || isRelighting || isBlending;

  return (
    <div className="relative w-full flex flex-col">
      {/* Hidden video element for camera feed */}
      <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />

      {/* 3D Environment */}
      <div className="relative">
        {localStream && (
          <Virtual3DEnvironment
            localVideoStream={localStream}
            selectedAngle={resolvedAngle}
            canvasRef={canvasRef}
          />
        )}

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
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Badge className="bg-green-500/80 text-white text-xs px-3 py-1">
                📍 Stand Here — MediaPipe is tracking your position
              </Badge>
            </div>
          </div>
        )}

        {/* Gesture overlays */}
        <CheekPullingOverlay enabled={false} />
        <FlyingKissParticle particles={particles} />
        <LipMarkOverlay lipMarks={lipMarks} />
        <SyncedHeartAnimation isSynced={false} />

        {/* Enhancing overlay */}
        {isEnhancing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-white font-medium">Enhancing lighting…</p>
          </div>
        )}

        {/* Recording countdown overlay */}
        {isRecording && countdown !== null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-destructive text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
            🎬 Recording: {countdown}s
          </div>
        )}

        <ShutterEffect trigger={shutterTrigger} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4 bg-background/80 backdrop-blur-sm border-t border-border flex-wrap">
        {showCountdown ? (
          <CountdownTimer
            onComplete={handleCountdownComplete}
            onCancel={() => setShowCountdown(false)}
          />
        ) : (
          <>
            <Button
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={() => setShowCountdown(true)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing…' : 'Capture'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => setShowSyncTutorial(true)}
              disabled={isRecording}
            >
              <Music2 className="w-4 h-4" />
              Sync Dance
            </Button>

            <Button
              size="sm"
              variant={isListening ? 'destructive' : 'outline'}
              className="rounded-full"
              onClick={handleFlyingKiss}
            >
              💋 Flying Kiss
            </Button>

            {/* Snap Effects toggle */}
            <Button
              size="sm"
              variant={snapEffectsEnabled ? 'default' : 'outline'}
              className={`rounded-full gap-1.5 ${snapEffectsEnabled ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}
              onClick={toggleSnapEffects}
            >
              <Sparkles className="w-4 h-4" />
              Snap
            </Button>
            {snapEffectsEnabled && (
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 text-xs">
                Snap Active
              </Badge>
            )}

            {/* Body Tracking toggle */}
            <Button
              size="sm"
              variant={bodyTrackingEnabled ? 'default' : 'outline'}
              className={`rounded-full gap-1.5 ${bodyTrackingEnabled ? 'bg-green-500 hover:bg-green-600' : ''}`}
              onClick={toggleBodyTracking}
            >
              <PersonStanding className="w-4 h-4" />
              Track
            </Button>

            {/* Write a Letter */}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => setIsLetterModalOpen(true)}
            >
              <PenLine className="w-4 h-4" />
              Letter
            </Button>
          </>
        )}
      </div>

      {/* Heartbeat Sync UI */}
      <div className="px-4 pb-4">
        <HeartbeatSyncUI videoRef={localVideoRef} />
      </div>

      {/* Sync Dance Tutorial */}
      <SyncDanceTutorial
        open={showSyncTutorial}
        onOpenChange={setShowSyncTutorial}
        onStartRecording={handleSyncDanceStart}
      />

      {/* Sync Dance Review */}
      {showDanceReview && danceResult && (
        <SyncDanceReview
          localBlob={danceResult.localBlob}
          remoteBlob={danceResult.remoteBlob}
          onClose={() => {
            setShowDanceReview(false);
            resetDance();
          }}
        />
      )}

      {/* Parchment Letter Modal */}
      <ParchmentLetterModal open={isLetterModalOpen} onOpenChange={setIsLetterModalOpen} />
    </div>
  );
}
