import { useState } from 'react';
import { toast } from 'sonner';

const CLAID_API_KEY = import.meta.env.VITE_CLAID_API_KEY as string | undefined;

async function upscaleWithClaid(blob: Blob): Promise<Blob> {
  if (!CLAID_API_KEY) {
    throw new Error('Claid.ai API key not configured');
  }

  const formData = new FormData();
  formData.append('file', blob, 'photo.jpg');

  const uploadRes = await fetch('https://api.claid.ai/v1-beta1/image/edit/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAID_API_KEY}`,
    },
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`Claid.ai upload failed: ${uploadRes.statusText}`);
  }

  const uploadData = await uploadRes.json();
  const inputUrl: string = uploadData?.data?.output?.tmp_url ?? uploadData?.output?.tmp_url;

  if (!inputUrl) {
    throw new Error('Claid.ai did not return an upload URL');
  }

  const editRes = await fetch('https://api.claid.ai/v1-beta1/image/edit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLAID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: inputUrl,
      operations: {
        resizing: { fit: 'bounds', width: 1920, height: 1080 },
        adjustments: { sharpness: 10 },
      },
      output: { format: { type: 'jpeg', quality: 95 } },
    }),
  });

  if (!editRes.ok) {
    throw new Error(`Claid.ai edit failed: ${editRes.statusText}`);
  }

  const editData = await editRes.json();
  const outputUrl: string = editData?.data?.output?.tmp_url ?? editData?.output?.tmp_url;

  if (!outputUrl) {
    throw new Error('Claid.ai did not return an output URL');
  }

  const imgRes = await fetch(outputUrl);
  if (!imgRes.ok) throw new Error('Failed to download upscaled image');
  return imgRes.blob();
}

async function fallbackUpscale(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const targetW = Math.max(img.width, 1920);
      const targetH = Math.max(img.height, 1080);
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.95
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function usePhotoExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPhoto = async (
    photoData: ArrayBuffer | Blob,
    roomId: string,
    index: number
  ) => {
    setIsExporting(true);
    try {
      let blob: Blob;
      if (photoData instanceof Blob) {
        blob = photoData;
      } else {
        blob = new Blob([photoData], { type: 'image/jpeg' });
      }

      let finalBlob: Blob;
      try {
        finalBlob = await upscaleWithClaid(blob);
      } catch (err) {
        console.warn('Claid.ai upscaling failed, using fallback:', err);
        toast.warning('HD upscaling unavailable — using local scaling instead.');
        finalBlob = await fallbackUpscale(blob);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `togetherframe-${roomId}-${index + 1}-${timestamp}.jpg`;
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('HD photo downloaded!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export photo.');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPhoto, isExporting };
}
