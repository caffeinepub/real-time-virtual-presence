import React, { useMemo } from 'react';
import ScratchCardCanvas from '@/components/scratch-card/ScratchCardCanvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function ScratchCardPage() {
  const photoUrl = useMemo(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      return params.get('photo') ?? null;
    } catch {
      return null;
    }
  }, []);

  if (!photoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Scratch Card</h1>
          <p className="text-muted-foreground">No photo data found. This link may be invalid or expired.</p>
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
          <h1 className="text-xl font-bold text-foreground">Scratch to Reveal Your Memory</h1>
          <p className="text-sm text-muted-foreground">Drag your finger or mouse to scratch away the foil</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <ScratchCardCanvas photoUrl={photoUrl} />
      </main>
    </div>
  );
}
