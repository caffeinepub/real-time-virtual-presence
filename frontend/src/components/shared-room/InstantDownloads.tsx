import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, Film, Loader2, Video } from 'lucide-react';
import { usePhotoExport } from '@/hooks/usePhotoExport';
import { useInVideoBlooper } from '@/hooks/useInVideoBlooper';
import { toast } from 'sonner';

interface InstantDownloadsProps {
  topPhoto: { data: ArrayBuffer | Blob; index: number } | null;
  timelapseBlob: Blob | null;
  roomId: string;
  showTimelapse?: boolean;
  photoUrls?: string[];
}

export default function InstantDownloads({
  topPhoto,
  timelapseBlob,
  roomId,
  showTimelapse = true,
  photoUrls = [],
}: InstantDownloadsProps) {
  const { exportPhoto, isExporting } = usePhotoExport();
  const { createBlooperVideo, isProcessing, resultMessage, resetResult } = useInVideoBlooper();
  const [isDownloadingReel, setIsDownloadingReel] = useState(false);
  const [blooperModalOpen, setBlooperModalOpen] = useState(false);

  const handlePhotoDownload = async () => {
    if (!topPhoto) return;
    await exportPhoto(topPhoto.data, roomId, topPhoto.index);
  };

  const handleReelDownload = async () => {
    if (!timelapseBlob) return;
    setIsDownloadingReel(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `togetherframe-reel-${roomId}-${timestamp}.webm`;
      const url = URL.createObjectURL(timelapseBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Behind-the-scenes reel downloaded!');
    } catch {
      toast.error('Failed to download reel.');
    } finally {
      setIsDownloadingReel(false);
    }
  };

  const handleCreateBlooper = async () => {
    setBlooperModalOpen(true);
    resetResult();
    await createBlooperVideo(photoUrls);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Instant Downloads
        </h3>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full gap-2"
            size="sm"
            onClick={handlePhotoDownload}
            disabled={!topPhoto || isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Upscaling…' : 'Download Perfect Photo (HD)'}
          </Button>

          {showTimelapse && (
            <Button
              className="w-full gap-2"
              size="sm"
              variant="outline"
              onClick={handleReelDownload}
              disabled={!timelapseBlob || isDownloadingReel}
            >
              {isDownloadingReel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Film className="w-4 h-4" />
              )}
              {isDownloadingReel ? 'Preparing…' : 'Download Behind-the-Scenes Reel'}
            </Button>
          )}

          <Button
            className="w-full gap-2"
            size="sm"
            variant="outline"
            onClick={handleCreateBlooper}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            {isProcessing ? 'Processing…' : 'Create Blooper Video'}
          </Button>
        </div>
      </div>

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
