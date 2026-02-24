import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Film, Loader2, Video } from 'lucide-react';
import { useInVideoBlooper } from '../../hooks/useInVideoBlooper';

interface TimelapseViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoBlob: Blob | null;
  photoUrls?: string[];
}

export default function TimelapseViewer({ open, onOpenChange, videoBlob, photoUrls = [] }: TimelapseViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blooperModalOpen, setBlooperModalOpen] = useState(false);

  const { createBlooperVideo, isProcessing, resultMessage, resetResult } = useInVideoBlooper();

  const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadTimelapse = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timelapse-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBlooper = async () => {
    setBlooperModalOpen(true);
    resetResult();
    await createBlooperVideo(photoUrls);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Film className="w-5 h-5 text-primary" />
              Timelapse Viewer
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Watch your session timelapse and create a blooper video.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                  No timelapse available
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                onClick={togglePlay}
                disabled={!videoBlob}
                className="flex-1 gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadTimelapse}
                disabled={!videoBlob}
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateBlooper}
                disabled={isProcessing}
                className="flex-1 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                Create Blooper
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* InVideo Blooper Modal */}
      <Dialog open={blooperModalOpen} onOpenChange={setBlooperModalOpen}>
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Video className="w-5 h-5 text-primary" />
              Create Blooper Video
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              InVideo AI is processing your photos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Sending photos to InVideo AI for photo-to-video automation…
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl">🎥</div>
                <p className="text-sm text-foreground font-medium">Request Sent!</p>
                <p className="text-xs text-muted-foreground">{resultMessage}</p>
              </>
            )}
          </div>
          <Button onClick={() => setBlooperModalOpen(false)} disabled={isProcessing} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
