import React, { useState } from 'react';
import { Photo } from '../../backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  QrCode,
  Gift,
  Film,
  Printer,
  Loader2,
  TrendingUp,
  Image as ImageIcon,
  Play,
  Sparkles,
} from 'lucide-react';
import { usePhotoExport } from '../../hooks/usePhotoExport';
import { useQRCodeGenerator } from '../../hooks/useQRCodeGenerator';
import { useTimelapseGenerator } from '../../hooks/useTimelapseGenerator';
import TimelapseViewer from './TimelapseViewer';
import InstantDownloads from './InstantDownloads';
import { usePrintroveOrder, PrintOrderPayload } from '../../hooks/usePrintroveOrder';
import { useShotstackReel } from '../../hooks/useShotstackReel';
import { toast } from 'sonner';

interface LocalPhoto {
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

interface PhotoGalleryProps {
  roomId: string;
  photos?: LocalPhoto[];
  backendPhotos?: Photo[];
}

export default function PhotoGallery({ roomId, photos = [], backendPhotos = [] }: PhotoGalleryProps) {
  const { exportPhoto, isExporting } = usePhotoExport();
  const { generateQRCode } = useQRCodeGenerator();

  // Use backend photos for timelapse if provided
  const photosForTimelapse: Photo[] = backendPhotos ?? [];
  const { triggerGeneration, isGenerating, videoBlob, progress, canGenerate } = useTimelapseGenerator(photosForTimelapse);

  const { submitPrintOrder, isSubmitting } = usePrintroveOrder();
  const { createTrendingReel, isProcessing: isReelProcessing, resultMessage: reelResult, resetResult: resetReel } = useShotstackReel();

  const [showTimelapse, setShowTimelapse] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPhotoIndex, setPrintPhotoIndex] = useState<number | null>(null);
  const [printPhotoIsBackend, setPrintPhotoIsBackend] = useState(false);
  const [printForm, setPrintForm] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    city: '',
    pinCode: '',
    printSize: '4x6' as '4x6' | '5x7' | '8x10',
  });

  // Reel modal state
  const [reelModalOpen, setReelModalOpen] = useState(false);

  const topPhoto = photos.length > 0
    ? { data: photos[photos.length - 1].data, index: photos.length - 1 }
    : null;

  const photoUrls = photos.map((p) => p.url);

  const handleExportLocal = async (photo: LocalPhoto, index: number) => {
    setExportingIndex(index);
    await exportPhoto(photo.data, roomId, index);
    setExportingIndex(null);
  };

  const handleExportBackend = async (photo: Photo, index: number) => {
    setExportingIndex(1000 + index);
    try {
      const bytes = await photo.photoBlob.getBytes();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
      await exportPhoto(blob, roomId, index);
    } catch {
      toast.error('Failed to export photo.');
    }
    setExportingIndex(null);
  };

  const handleScratchCard = (photoUrl: string) => {
    const url = `${window.location.origin}/scratch-card#photo=${encodeURIComponent(photoUrl)}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Scratch card link copied to clipboard!');
    }).catch(() => {
      toast.info(`Share this link: ${url}`);
    });
  };

  const handleGenerateQR = async () => {
    if (!videoBlob) return;
    try {
      const videoUrl = URL.createObjectURL(videoBlob);
      const shareUrl = `${window.location.origin}/timelapse-player#video=${encodeURIComponent(videoUrl)}`;
      const dataUrl = await generateQRCode(shareUrl);
      setQrDataUrl(dataUrl);
      setQrModalOpen(true);
    } catch {
      toast.error('Failed to generate QR code.');
    }
  };

  const openPrintModal = (index: number, isBackend: boolean) => {
    setPrintPhotoIndex(index);
    setPrintPhotoIsBackend(isBackend);
    setPrintForm({ recipientName: '', phone: '', addressLine1: '', city: '', pinCode: '', printSize: '4x6' });
    setPrintModalOpen(true);
  };

  const handlePrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (printPhotoIndex === null) return;

    let blob: Blob;
    if (printPhotoIsBackend && backendPhotos[printPhotoIndex]) {
      const bytes = await backendPhotos[printPhotoIndex].photoBlob.getBytes();
      blob = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
    } else if (photos[printPhotoIndex]) {
      blob = new Blob([photos[printPhotoIndex].data], { type: 'image/jpeg' });
    } else {
      return;
    }

    const payload: PrintOrderPayload = { photo: blob, ...printForm };
    const result = await submitPrintOrder(payload);
    if (result.success) {
      toast.success('Print order placed! Delivery via Printrove (India)');
      setPrintModalOpen(false);
    }
  };

  const handleCreateReel = async () => {
    setReelModalOpen(true);
    resetReel();
    await createTrendingReel(photoUrls);
  };

  const hasPhotos = photos.length > 0 || backendPhotos.length > 0;

  if (!hasPhotos) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No photos yet. Capture your first memory!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Instant Downloads */}
      <InstantDownloads
        topPhoto={topPhoto}
        timelapseBlob={videoBlob ?? null}
        roomId={roomId}
        showTimelapse={true}
        photoUrls={photoUrls}
      />

      {/* Gallery toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Photos ({photos.length + backendPhotos.length})
          </span>
          {isGenerating && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {Math.round(progress * 100)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canGenerate && !videoBlob && (
            <Button size="sm" variant="outline" onClick={triggerGeneration} disabled={isGenerating} className="gap-1.5 text-xs">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Reel
            </Button>
          )}
          {videoBlob && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowTimelapse(true)} className="gap-1.5 text-xs">
                <Play className="w-3.5 h-3.5" />
                Watch Reel
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateQR} className="gap-1.5 text-xs">
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateReel}
            disabled={isReelProcessing || photos.length === 0}
            className="gap-1.5 text-xs"
          >
            {isReelProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Trending Reel
          </Button>
        </div>
      </div>

      {/* Local photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, index) => (
            <div key={photo.timestamp} className="flex flex-col gap-1">
              <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-black group">
                <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 text-xs"
                    onClick={() => handleExportLocal(photo, index)}
                    disabled={exportingIndex === index || isExporting}
                  >
                    {exportingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    HD
                  </Button>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs h-7" onClick={() => handleScratchCard(photo.url)}>
                  <Gift className="w-3 h-3" />
                  Scratch
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs h-7" onClick={() => openPrintModal(index, false)}>
                  <Printer className="w-3 h-3" />
                  Print
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backend photos grid */}
      {backendPhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved to Cloud</h4>
          <div className="grid grid-cols-2 gap-2">
            {backendPhotos.map((photo, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-black group">
                  <img src={photo.photoBlob.getDirectURL()} alt={`Cloud photo ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1 text-xs"
                      onClick={() => handleExportBackend(photo, index)}
                      disabled={exportingIndex === 1000 + index || isExporting}
                    >
                      {exportingIndex === 1000 + index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      HD
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs h-7" onClick={() => handleScratchCard(photo.photoBlob.getDirectURL())}>
                    <Gift className="w-3 h-3" />
                    Scratch
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs h-7" onClick={() => openPrintModal(index, true)}>
                    <Printer className="w-3 h-3" />
                    Print
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timelapse Viewer */}
      {showTimelapse && videoBlob && (
        <TimelapseViewer
          open={showTimelapse}
          onOpenChange={setShowTimelapse}
          videoBlob={videoBlob}
          photoUrls={photoUrls}
        />
      )}

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share via QR Code</DialogTitle>
            <DialogDescription className="text-muted-foreground">Scan to watch your timelapse reel.</DialogDescription>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3 p-4">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-border" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataUrl;
                  a.download = `timelapse-qr-${roomId}.png`;
                  a.click();
                }}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR PNG
              </Button>
            </div>
          )}
          <Button onClick={() => setQrModalOpen(false)} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>

      {/* Print & Deliver Modal */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Printer className="w-5 h-5 text-primary" />
              Print & Deliver
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Order a physical print delivered anywhere in India via Printrove.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePrintSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pg-recipientName" className="text-sm">Recipient Name</Label>
              <Input id="pg-recipientName" value={printForm.recipientName} onChange={(e) => setPrintForm((f) => ({ ...f, recipientName: e.target.value }))} placeholder="Full name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-phone" className="text-sm">Phone Number</Label>
              <Input id="pg-phone" value={printForm.phone} onChange={(e) => setPrintForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-addressLine1" className="text-sm">Delivery Address</Label>
              <Input id="pg-addressLine1" value={printForm.addressLine1} onChange={(e) => setPrintForm((f) => ({ ...f, addressLine1: e.target.value }))} placeholder="Street address" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pg-city" className="text-sm">City</Label>
                <Input id="pg-city" value={printForm.city} onChange={(e) => setPrintForm((f) => ({ ...f, city: e.target.value }))} placeholder="Mumbai" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pg-pinCode" className="text-sm">PIN Code</Label>
                <Input id="pg-pinCode" value={printForm.pinCode} onChange={(e) => setPrintForm((f) => ({ ...f, pinCode: e.target.value }))} placeholder="400001" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Print Size</Label>
              <Select value={printForm.printSize} onValueChange={(v) => setPrintForm((f) => ({ ...f, printSize: v as '4x6' | '5x7' | '8x10' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4x6">4×6 inches (Standard)</SelectItem>
                  <SelectItem value="5x7">5×7 inches (Medium)</SelectItem>
                  <SelectItem value="8x10">8×10 inches (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPrintModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                {isSubmitting ? 'Placing Order…' : 'Place Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shotstack Reel Modal */}
      <Dialog open={reelModalOpen} onOpenChange={setReelModalOpen}>
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Create Trending Reel
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Shotstack is generating your music-synced reel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            {isReelProcessing ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Generating your music-synced reel…</p>
              </>
            ) : (
              <>
                <div className="text-3xl">🎬</div>
                <p className="text-sm text-foreground font-medium">Processing Complete!</p>
                <p className="text-xs text-muted-foreground">{reelResult}</p>
              </>
            )}
          </div>
          <Button onClick={() => setReelModalOpen(false)} disabled={isReelProcessing} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
