import React from 'react';
import { Heart, Activity, Smartphone, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHeartbeatSync } from '../../hooks/useHeartbeatSync';

interface HeartbeatSyncUIProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function HeartbeatSyncUI({ videoRef }: HeartbeatSyncUIProps) {
  const {
    bpm,
    confidence,
    isDetecting,
    isSynced,
    pulseData,
    startDetection,
    stopDetection,
    useDeviceHealthSensor,
    toggleDeviceHealthSensor,
  } = useHeartbeatSync(videoRef);

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${isSynced ? 'text-red-400 animate-pulse' : 'text-white/60'}`} />
          <span className="text-white font-medium text-sm">Heartbeat Sync</span>
        </div>
        {isSynced && (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
            Synced ❤️
          </Badge>
        )}
      </div>

      {/* Device Health Sensor Toggle */}
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-white/70" />
          <span className="text-white/80 text-xs">Use Device Health Sensor</span>
        </div>
        <button
          onClick={toggleDeviceHealthSensor}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            useDeviceHealthSensor ? 'bg-green-500' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              useDeviceHealthSensor ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {useDeviceHealthSensor ? (
        /* Device Sensor Mode */
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs text-green-300 space-y-1">
            <p className="font-medium">📱 Device Sensor Active (Mock)</p>
            <p className="text-green-200/70">Open Apple Health / Google Fit on your device and grant permissions.</p>
            <p className="text-green-200/50 text-xs mt-1">
              TODO: Connect to HealthKit (iOS) or Google Fit REST API for real data.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 bg-white/5 rounded-lg p-4">
            <Heart className="w-8 h-8 text-red-400 animate-pulse" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">72</div>
              <div className="text-xs text-white/50">BPM</div>
              <Badge className="mt-1 bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                Device Sensor (mock)
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        /* rPPG Camera Mode */
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Camera className="w-3 h-3" />
            <span>Camera-based rPPG detection</span>
          </div>

          {isDetecting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{bpm > 0 ? bpm : '—'}</div>
                  <div className="text-xs text-white/50">BPM</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white/80">{confidence}%</div>
                  <div className="text-xs text-white/50">Confidence</div>
                </div>
              </div>

              {pulseData.length > 0 && (
                <div className="h-12 flex items-end gap-0.5">
                  {pulseData.slice(-20).map((val, i) => {
                    const min = Math.min(...pulseData);
                    const max = Math.max(...pulseData);
                    const range = max - min || 1;
                    const height = Math.max(4, ((val - min) / range) * 40);
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-red-400/70 rounded-sm transition-all"
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={stopDetection}
                className="w-full border-white/20 text-white/80 hover:bg-white/10 text-xs"
              >
                <Activity className="w-3 h-3 mr-1" />
                Stop Detection
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={startDetection}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs"
            >
              <Heart className="w-3 h-3 mr-1" />
              Start Heartbeat Detection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
