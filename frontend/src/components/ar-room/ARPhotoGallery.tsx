import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Download, Share2, Loader2, Printer, TrendingUp } from 'lucide-react';
import { usePhotoExport } from '@/hooks/usePhotoExport';
import { usePrintroveOrder, PrintOrderPayload } from '@/hooks/usePrintroveOrder';
import { useShotstackReel } from '@/hooks/useShotstackReel';
import { toast } from 'sonner';

export interface ARPhoto {
  id?: string;
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

interface ARPhotoGalleryProps {
  photos: ARPhoto[];
  roomId: string;
}

export default function ARPhotoGallery({ photos, roomId }: ARPhotoGalleryProps) {
  const { exportPhoto, isExporting } = usePhotoExport();
  const { submitPrintOrder, isSubmitting } = usePrintroveOrder();
  const { createTrendingReel, isProcessing: isReelProcessing, resultMessage: reelResult, resetResult: resetReel } = useShotstackReel();

  const [exportingIndex, setExportingIndex] = useState<number | null>(null);

  // Print modal state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPhotoIndex, setPrintPhotoIndex] = useState<number | null>(null);
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

  const handleExport = async (photo: ARPhoto, index: number) => {
    setExportingIndex(index);
    await exportPhoto(photo.data, roomId, index);
    setExportingIndex(null);
  };

  const handleScratchCard = (photo: ARPhoto) => {
    const url = `${window.location.origin}/scratch-card#photo=${encodeURIComponent(photo.url)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Scratch card link copied to clipboard!'))
      .catch(() => toast.info(`Share this link: ${url}`));
  };

  const openPrintModal = (index: number) => {
    setPrintPhotoIndex(index);
    setPrintForm({ recipientName: '', phone: '', addressLine1: '', city: '', pinCode: '', printSize: '4x6' });
    setPrintModalOpen(true);
  };

  const handlePrintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (printPhotoIndex === null) return;
    const photo = photos[printPhotoIndex];
    const blob = new Blob([photo.data], { type: 'image/jpeg' });
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
    const photoUrls = photos.map((p) => p.url);
    await createTrendingReel(photoUrls);
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
        <p className="text-sm text-muted-foreground">No AR photos yet. Capture your first memory!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreateReel}
          disabled={isReelProcessing}
          className="gap-1.5 text-xs"
        >
          {isReelProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5" />
          )}
          Create Trending Reel
        </Button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.timestamp} className="flex flex-col gap-1">
            <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-black group">
              <img
                src={photo.url}
                alt={`AR Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 text-xs"
                  onClick={() => handleExport(photo, index)}
                  disabled={exportingIndex === index || isExporting}
                >
                  {exportingIndex === index ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  HD
                </Button>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 gap-1 text-xs h-7"
                onClick={() => handleScratchCard(photo)}
              >
                <Share2 className="w-3 h-3" />
                Scratch Card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 gap-1 text-xs h-7"
                onClick={() => openPrintModal(index)}
              >
                <Printer className="w-3 h-3" />
                Print
              </Button>
            </div>
          </div>
        ))}
      </div>

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
              <Label htmlFor="ar-recipientName" className="text-sm">Recipient Name</Label>
              <Input
                id="ar-recipientName"
                value={printForm.recipientName}
                onChange={(e) => setPrintForm((f) => ({ ...f, recipientName: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-phone" className="text-sm">Phone Number</Label>
              <Input
                id="ar-phone"
                value={printForm.phone}
                onChange={(e) => setPrintForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-addressLine1" className="text-sm">Delivery Address</Label>
              <Input
                id="ar-addressLine1"
                value={printForm.addressLine1}
                onChange={(e) => setPrintForm((f) => ({ ...f, addressLine1: e.target.value }))}
                placeholder="Street address, apartment, etc."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ar-city" className="text-sm">City</Label>
                <Input
                  id="ar-city"
                  value={printForm.city}
                  onChange={(e) => setPrintForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Mumbai"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ar-pinCode" className="text-sm">PIN Code</Label>
                <Input
                  id="ar-pinCode"
                  value={printForm.pinCode}
                  onChange={(e) => setPrintForm((f) => ({ ...f, pinCode: e.target.value }))}
                  placeholder="400001"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Print Size</Label>
              <Select
                value={printForm.printSize}
                onValueChange={(v) => setPrintForm((f) => ({ ...f, printSize: v as '4x6' | '5x7' | '8x10' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4x6">4×6 inches (Standard)</SelectItem>
                  <SelectItem value="5x7">5×7 inches (Medium)</SelectItem>
                  <SelectItem value="8x10">8×10 inches (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPrintModalOpen(false)}>
                Cancel
              </Button>
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
          <Button onClick={() => setReelModalOpen(false)} disabled={isReelProcessing} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
