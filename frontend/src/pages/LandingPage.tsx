import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Heart, Zap, Film, Download, Music2,
  ChevronDown, ChevronUp, ExternalLink, Sparkles
} from 'lucide-react';

const AI_TOOLS = [
  {
    name: 'Clipdrop Relight',
    url: 'https://clipdrop.co/apis/docs/relight',
    desc: 'Lighting correction',
    color: 'text-teal-600',
  },
  {
    name: 'Claid.ai',
    url: 'https://claid.ai/',
    desc: 'HD upscaling (300 DPI)',
    color: 'text-amber-600',
  },
  {
    name: 'Adobe Firefly',
    url: 'https://firefly.adobe.com/',
    desc: 'Shadow & color blending',
    color: 'text-coral-600',
  },
];

const FEATURES = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Cheek Pulling',
    desc: 'Drag to stretch your partner\'s cheeks with playful AR deformation.',
    badge: 'VR + AR',
    detail: 'Uses 3D face mesh tracking for realistic skin-stretch simulation.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Flying Kiss',
    desc: 'Blow a kiss and watch animated lip-marks fly across the screen.',
    badge: 'VR + AR',
    detail: 'Audio-triggered particle system with trajectory animation.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Heartbeat Sync',
    desc: 'Sync your heartbeats using your camera\'s light sensor.',
    badge: 'VR + AR',
    detail: 'Photoplethysmography-based pulse detection with haptic feedback.',
  },
  {
    icon: <Music2 className="w-6 h-6" />,
    title: 'Sync Dance',
    desc: 'Record 15-second simultaneous dance clips side-by-side.',
    badge: 'VR + AR',
    detail: 'Dual-stream recording with side-by-side review. AI alignment coming soon.',
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Photo Capture',
    desc: 'Capture composite photos with automatic lighting enhancement.',
    badge: 'VR + AR',
    detail: 'Powered by Clipdrop Relight + Adobe Firefly for perfect blending.',
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'HD Export',
    desc: 'Download your memories at 300 DPI / 1920×1080 resolution.',
    badge: 'VR + AR',
    detail: 'Powered by Claid.ai for professional-grade upscaling.',
  },
  {
    icon: <Film className="w-6 h-6" />,
    title: 'Timelapse Reel',
    desc: 'Auto-generate a behind-the-scenes video from your session photos.',
    badge: 'VR',
    detail: 'Shareable via QR code — scan to watch on any device.',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Scratch Card',
    desc: 'Share photos as interactive scratch cards with a hidden reveal.',
    badge: 'VR + AR',
    detail: 'Canvas-based scratch mechanic with optional audio message.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/generated/hero-spatial.dim_1920x1080.png"
            alt="TogetherFrame hero"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center space-y-6">
          <Badge variant="outline" className="text-sm px-4 py-1 border-primary/40 text-primary">
            ✨ AI-Powered Couple Experiences
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
            Together<span className="text-primary">Frame</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create magical shared moments with your partner — virtual rooms, AR presence, and AI-enhanced memories.
          </p>

          {/* AI Tools strip */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-sm font-medium ${tool.color} hover:underline transition-colors`}
              >
                {tool.name}
                <ExternalLink className="w-3 h-3 opacity-60" />
                <span className="text-muted-foreground font-normal">— {tool.desc}</span>
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="px-8 rounded-full gap-2" onClick={() => navigate({ to: '/create-room' })}>
              <Camera className="w-5 h-5" />
              Start a Room
            </Button>
            <Button size="lg" variant="outline" className="px-8 rounded-full" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Mode Cards */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        {/* Virtual Room */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="relative h-48 overflow-hidden">
            <img
              src="/assets/generated/icon-virtual-room.dim_256x256.png"
              alt="Virtual Room"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Virtual Room</h2>
              <Badge className="bg-primary/10 text-primary border-primary/20">VR Mode</Badge>
            </div>
            <p className="text-muted-foreground">
              Share a 3D virtual space with your partner. Capture composite photos, generate timelapse reels, and download HD memories.
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Powered by: </span>
                <a href="https://clipdrop.co/apis/docs/relight" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-0.5">Clipdrop Relight<ExternalLink className="w-3 h-3" /></a>
                {', '}
                <a href="https://claid.ai/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline inline-flex items-center gap-0.5">Claid.ai<ExternalLink className="w-3 h-3" /></a>
                {', '}
                <a href="https://firefly.adobe.com/" target="_blank" rel="noopener noreferrer" className="text-coral-600 hover:underline inline-flex items-center gap-0.5">Adobe Firefly<ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pt-1">
              <li>✦ Cheek Pulling · Flying Kiss · Heartbeat Sync</li>
              <li>✦ Sync Dance · Scratch Card · Timelapse QR</li>
            </ul>
            <Button className="w-full mt-2 rounded-xl" onClick={() => navigate({ to: '/create-room' })}>
              Enter Virtual Room
            </Button>
          </div>
        </div>

        {/* AR Presence */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="relative h-48 overflow-hidden">
            <img
              src="/assets/generated/icon-ar-presence.dim_256x256.png"
              alt="AR Presence"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">AR Presence</h2>
              <Badge className="bg-accent/10 text-accent border-accent/20">AR Mode</Badge>
            </div>
            <p className="text-muted-foreground">
              Teleport your partner into your real room using augmented reality. See them in your space, capture the moment.
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Powered by: </span>
                <a href="https://clipdrop.co/apis/docs/relight" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-0.5">Clipdrop Relight<ExternalLink className="w-3 h-3" /></a>
                {', '}
                <a href="https://claid.ai/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline inline-flex items-center gap-0.5">Claid.ai<ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pt-1">
              <li>✦ Cheek Pulling · Flying Kiss · Heartbeat Sync</li>
              <li>✦ Sync Dance · Scratch Card · HD Export</li>
            </ul>
            <Button className="w-full mt-2 rounded-xl" variant="outline" onClick={() => navigate({ to: '/create-room' })}>
              Enter AR Room
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Feature Highlights</h2>
          <p className="text-muted-foreground">Everything you need for a magical shared experience</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-4 space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <Badge variant="outline" className="text-xs">{feature.badge}</Badge>
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
              {expandedFeature === i && (
                <p className="text-xs text-accent border-t border-border pt-2 mt-1">{feature.detail}</p>
              )}
              <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                {expandedFeature === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expandedFeature === i ? 'Less' : 'Details'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
