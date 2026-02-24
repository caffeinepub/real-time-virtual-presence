import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Play, Pause, Download, X, Music2, Loader2 } from 'lucide-react';
import { useShotstackReel } from '../../hooks/useShotstackReel';

interface SyncDanceReviewProps {
  localBlob: Blob | null;
  remoteBlob: Blob | null;
  onClose: () => void;
}

export default function SyncDanceReview({ localBlob, remoteBlob, onClose }: SyncDanceReviewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [remotePlaying, setRemotePlaying] = useState(false);
  const [reelModalOpen, setReelModalOpen] = useState(false);

  const { createTrendingReel, isProcessing, resultMessage, resetResult } = useShotstackReel();

  const localUrl = localBlob ? URL.createObjectURL(localBlob) : null;
  const remoteUrl = remoteBlob ? URL.createObjectURL(remoteBlob) : null;

  const togglePlay = (side: 'local' | 'remote') => {
    const ref = side === 'local' ? localVideoRef : remoteVideoRef;
    const playing = side === 'local' ? localPlaying : remotePlaying;
    const setPlaying = side === 'local' ? setLocalPlaying : setRemotePlaying;

    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play();
    }
    setPlaying(!playing);
  };

  const downloadVideo = (blob: Blob | null, filename: string) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateReel = async () => {
    setReelModalOpen(true);
    resetResult();
    const blobs = [localBlob, remoteBlob].filter(Boolean) as Blob[];
    await createTrendingReel(blobs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Music2 className="w-5 h-5 text-primary" />
          <h2 className="text-white font-semibold text-lg">Sync Dance Review</h2>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Side by Side</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateReel}
            disabled={isProcessing}
            className="border-white/20 text-white/80 hover:bg-white/10 gap-1.5 text-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Music2 className="w-3.5 h-3.5" />
            )}
            Auto-Edit with Music
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Videos */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Local video */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">Your Dance</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => downloadVideo(localBlob, 'my-dance.webm')}
              disabled={!localBlob}
              className="text-white/50 hover:text-white hover:bg-white/10 gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          </div>
          <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
            {localUrl ? (
              <video
                ref={localVideoRef}
                src={localUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                onEnded={() => setLocalPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                No recording available
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => togglePlay('local')}
            disabled={!localBlob}
            className="gap-2"
          >
            {localPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {localPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>

        {/* Remote video */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">Partner's Dance</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => downloadVideo(remoteBlob, 'partner-dance.webm')}
              disabled={!remoteBlob}
              className="text-white/50 hover:text-white hover:bg-white/10 gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          </div>
          <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
            {remoteUrl ? (
              <video
                ref={remoteVideoRef}
                src={remoteUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                onEnded={() => setRemotePlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                No recording available
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => togglePlay('remote')}
            disabled={!remoteBlob}
            variant="outline"
            className="gap-2 border-white/20 text-white/80 hover:bg-white/10"
          >
            {remotePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {remotePlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>

      {/* Shotstack Reel Modal */}
      <Dialog open={reelModalOpen} onOpenChange={setReelModalOpen}>
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Music2 className="w-5 h-5 text-primary" />
              Auto-Edit with Music
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Shotstack is processing your dance videos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Generating your music-synced reel…</p>
              </>
            ) : (
              <>
                <div className="text-3xl">🎬</div>
                <p className="text-sm text-foreground font-medium">Processing Complete!</p>
                <p className="text-xs text-muted-foreground">{resultMessage}</p>
              </>
            )}
          </div>
          <Button
            onClick={() => setReelModalOpen(false)}
            disabled={isProcessing}
            className="w-full"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
