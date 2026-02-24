import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Download } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function TimelapsePlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = useMemo(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      return params.get('video') ?? null;
    } catch {
      return null;
    }
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `timelapse-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Timelapse Player</h1>
          <p className="text-muted-foreground">No video data found. This link may be invalid or expired.</p>
        </div>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Behind-the-Scenes Reel</h1>
          <p className="text-sm text-muted-foreground">Your timelapse memory</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-border bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto"
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={togglePlay} className="gap-2">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download Reel
          </Button>
        </div>
      </main>
    </div>
  );
}
