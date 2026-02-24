import { useState, useEffect } from 'react';

// Dynamically load qrcode library from CDN
let QRCode: any = null;

async function loadQRCode(): Promise<any> {
  if (QRCode) return QRCode;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = () => {
      QRCode = (window as any).QRCode;
      resolve(QRCode);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function useQRCodeGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = async (url: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    try {
      const qr = await loadQRCode();
      const dataUrl: string = await new Promise((resolve, reject) => {
        qr.toDataURL(url, { width: 256, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } }, (err: any, url: string) => {
          if (err) reject(err);
          else resolve(url);
        });
      });
      return dataUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'QR generation failed';
      setError(msg);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateQRCode, isGenerating, error };
}
