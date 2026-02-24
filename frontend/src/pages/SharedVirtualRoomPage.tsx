import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft, Image } from 'lucide-react';
import DualCameraView from '../components/shared-room/DualCameraView';
import CameraAngleSelector from '../components/shared-room/CameraAngleSelector';
import PhotoGallery from '../components/shared-room/PhotoGallery';
import { useVerifyRoomCreator, useGetPhotosByRoom } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import CameraPermissionGate from '../components/shared-room/CameraPermissionGate';

interface LocalPhoto {
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

export default function SharedVirtualRoomPage() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const navigate = useNavigate();
  const [selectedAngle, setSelectedAngle] = useState<'stage' | 'side' | 'group'>('stage');
  const [showGallery, setShowGallery] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [localPhotos, setLocalPhotos] = useState<LocalPhoto[]>([]);

  const { data: isCreator, isLoading: verifyLoading } = useVerifyRoomCreator(roomId);
  const { data: backendPhotos = [] } = useGetPhotosByRoom(roomId);

  const handlePhotoCapture = (photoData: ArrayBuffer, photoUrl: string) => {
    setLocalPhotos((prev) => [...prev, { url: photoUrl, data: photoData, timestamp: Date.now() }]);
  };

  const handlePermissionGranted = (stream: MediaStream) => {
    setCameraStream(stream);
  };

  const handlePermissionCancel = () => {
    navigate({ to: '/' });
  };

  if (verifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You are not the creator of this room.</p>
          <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!cameraStream && !showGallery) {
    return (
      <CameraPermissionGate
        onPermissionGranted={handlePermissionGranted}
        onCancel={handlePermissionCancel}
      />
    );
  }

  if (showGallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button onClick={() => setShowGallery(false)} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Room
            </Button>
            <h1 className="text-2xl font-bold">Photo Gallery</h1>
            <div className="w-24" />
          </div>
          <PhotoGallery
            roomId={roomId}
            photos={localPhotos}
            backendPhotos={backendPhotos}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate({ to: '/' })} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shared Virtual Room
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Room ID: <span className="font-mono">{roomId}</span>
            </p>
          </div>
          <Button onClick={() => setShowGallery(true)} variant="outline" size="sm">
            <Image className="w-4 h-4 mr-2" />
            Gallery ({localPhotos.length + backendPhotos.length})
          </Button>
        </div>

        <CameraAngleSelector
          selectedAngle={selectedAngle}
          onAngleChange={setSelectedAngle}
        />

        <DualCameraView
          roomId={roomId}
          cameraAngle={selectedAngle}
          onPhotoCapture={handlePhotoCapture}
          initialStream={cameraStream}
        />
      </div>
    </div>
  );
}
