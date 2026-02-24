import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, PersonStanding, Activity } from 'lucide-react';
import { useMediaPipeBodyTracking } from '../../hooks/useMediaPipeBodyTracking';

interface SyncDanceTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartRecording: () => void;
}

export default function SyncDanceTutorial({ open, onOpenChange, onStartRecording }: SyncDanceTutorialProps) {
  const { bodyTrackingEnabled, toggleBodyTracking, skeletonJoints, skeletonConnections } =
    useMediaPipeBodyTracking();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <DialogTitle className="text-foreground">Sync Dance Tutorial</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Learn the choreography and record your synchronized dance with your partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tutorial image with optional skeleton overlay */}
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            <img
              src="/assets/generated/sync-dance-placeholder.dim_600x400.png"
              alt="Sync Dance Tutorial"
              className="w-full h-full object-cover"
            />
            {bodyTrackingEnabled && (
              <div className="absolute inset-0">
                <svg
                  viewBox="0 0 1 1"
                  className="w-full h-full"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  {/* Draw skeleton connections */}
                  {skeletonConnections.map(([a, b], i) => (
                    <line
                      key={i}
                      x1={skeletonJoints[a].x}
                      y1={skeletonJoints[a].y}
                      x2={skeletonJoints[b].x}
                      y2={skeletonJoints[b].y}
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.008"
                    />
                  ))}
                  {/* Draw joints */}
                  {skeletonJoints.map((joint, i) => (
                    <circle
                      key={i}
                      cx={joint.x}
                      cy={joint.y}
                      r="0.018"
                      fill={joint.color}
                      stroke="white"
                      strokeWidth="0.004"
                    />
                  ))}
                </svg>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <Badge className="bg-green-500/80 text-white text-xs px-3 py-1">
                    📍 Stand Here — MediaPipe is tracking your position
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Body Tracking Toggle */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Body Tracking Mode</p>
                <p className="text-xs text-muted-foreground">
                  {bodyTrackingEnabled
                    ? 'MediaPipe skeleton overlay active (mock)'
                    : 'Enable to see position guidance'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleBodyTracking}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                bodyTrackingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bodyTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {bodyTrackingEnabled && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs text-green-700 dark:text-green-400">
              <p className="font-medium flex items-center gap-1">
                <PersonStanding className="w-3.5 h-3.5" />
                Stand Here — MediaPipe is tracking your position
              </p>
              <p className="mt-1 text-green-600/70 dark:text-green-500/70">
                TODO: Load MediaPipe Pose from CDN for real body landmark detection.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">How it works:</h4>
            <ol className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">1.</span>
                Watch the tutorial and learn the moves
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">2.</span>
                Both partners press "Record & Sync" simultaneously
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">3.</span>
                Dance for 15 seconds — your videos are recorded
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">4.</span>
                Review your side-by-side performance
              </li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                onStartRecording();
                onOpenChange(false);
              }}
              className="flex-1 gap-2"
            >
              <Play className="w-4 h-4" />
              Record & Sync
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
