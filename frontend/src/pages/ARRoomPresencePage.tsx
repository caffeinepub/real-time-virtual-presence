import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import VideoAROverlay from '@/components/ar-room/VideoAROverlay';
import ARPhotoGallery, { ARPhoto } from '@/components/ar-room/ARPhotoGallery';
import CameraPermissionGate from '@/components/ar-room/CameraPermissionGate';
import SyncDanceTutorial from '@/components/gestures/SyncDanceTutorial';
import SyncDanceReview from '@/components/gestures/SyncDanceReview';
import { useSyncDanceRecording } from '@/hooks/useSyncDanceRecording';
import { Button } from '@/components/ui/button';
import { Music2, Images, ArrowLeft } from 'lucide-react';

export default function ARRoomPresencePage() {
  const { roomId } = useParams({ from: '/ar-room/$roomId' });
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<ARPhoto[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [showSyncTutorial, setShowSyncTutorial] = useState(false);
  const [showDanceReview, setShowDanceReview] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const {
    isRecording,
    countdown,
    result: danceResult,
    startRecording,
    reset: resetDance,
  } = useSyncDanceRecording();

  useEffect(() => {
    if (danceResult) {
      setShowDanceReview(true);
    }
  }, [danceResult]);

  const handlePhotoCapture = () => {
    // Notification hook — actual photo data is handled by VideoAROverlay internally
  };

  const handleSyncDanceStart = () => {
    setShowSyncTutorial(false);
    startRecording(localStream, null);
  };

  const handlePermissionGranted = (stream: MediaStream) => {
    setCameraStream(stream);
    setLocalStream(stream);
  };

  const handlePermissionCancel = () => {
    navigate({ to: '/' });
  };

  if (!cameraStream) {
    return (
      <CameraPermissionGate
        onPermissionGranted={handlePermissionGranted}
        onCancel={handlePermissionCancel}
      />
    );
  }

  if (isARActive) {
    return (
      <VideoAROverlay
        roomId={roomId}
        onPhotoCapture={handlePhotoCapture}
        onExit={() => setIsARActive(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Home
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground">AR Room</h1>
          <p className="text-xs text-muted-foreground">Room: {roomId}</p>
        </div>
        <div className="flex gap-2">
          {isRecording && countdown !== null && (
            <div className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🎬 {countdown}s
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setShowSyncTutorial(true)}
            disabled={isRecording}
          >
            <Music2 className="w-4 h-4" />
            Sync Dance
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setShowGallery(!showGallery)}
          >
            <Images className="w-4 h-4" />
            Gallery ({photos.length})
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        <div className={`flex-1 flex flex-col items-center justify-center p-8 gap-6 ${showGallery ? 'hidden md:flex' : ''}`}>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 space-y-4 max-w-lg w-full">
            <h2 className="text-xl font-semibold text-foreground">Before You Start</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                Position your phone to capture your physical environment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                Use the perspective grid to align the remote video overlay
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                Try interactive gestures: cheek pulling, flying kiss, heartbeat sync
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-500 mt-0.5">•</span>
                Lighting enhanced automatically via Clipdrop Relight
              </li>
            </ul>
          </div>
          <Button
            size="lg"
            className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
            onClick={() => setIsARActive(true)}
          >
            Start AR Session
          </Button>
        </div>

        {showGallery && (
          <div className="w-full md:w-80 border-l border-border bg-card overflow-y-auto">
            <ARPhotoGallery photos={photos} roomId={roomId} />
          </div>
        )}
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
    </div>
  );
}
