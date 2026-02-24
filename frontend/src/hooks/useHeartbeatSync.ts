import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

// TODO: Implement HealthKit (iOS) REST API for heart rate data — requires OAuth flow.
// TODO: Implement Google Fit REST API OAuth flow using VITE_GOOGLE_FIT_CLIENT_ID.
// Replace mock BPM with real sensor data from the OAuth API.
const GOOGLE_FIT_CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID as string | undefined;

export interface HeartbeatSyncReturn {
  bpm: number;
  confidence: number;
  isDetecting: boolean;
  isSynced: boolean;
  pulseData: number[];
  startDetection: () => void;
  stopDetection: () => void;
  useDeviceHealthSensor: boolean;
  toggleDeviceHealthSensor: () => void;
}

export function useHeartbeatSync(videoRef: RefObject<HTMLVideoElement | null>): HeartbeatSyncReturn {
  const [bpm, setBpm] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [pulseData, setPulseData] = useState<number[]>([]);
  const [useDeviceHealthSensor, setUseDeviceHealthSensor] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplesRef = useRef<number[]>([]);
  const lastBeatRef = useRef<number>(0);
  const bpmHistoryRef = useRef<number[]>([]);

  const toggleDeviceHealthSensor = useCallback(() => {
    setUseDeviceHealthSensor((prev) => {
      const next = !prev;
      if (next) {
        // TODO: Implement HealthKit (iOS) REST API for heart rate data — requires OAuth flow.
        // TODO: Implement Google Fit REST API OAuth flow using VITE_GOOGLE_FIT_CLIENT_ID.
        console.info('[HeartbeatSync] Device Health Sensor mode enabled. Google Fit Client ID:', GOOGLE_FIT_CLIENT_ID || '(not set)');
        setBpm(72);
        setConfidence(100);
        setIsDetecting(true);
        setPulseData([72, 72, 72, 72, 72]);
      } else {
        console.info('[HeartbeatSync] Device Health Sensor mode disabled. Reverting to rPPG camera detection.');
        setBpm(0);
        setConfidence(0);
        setIsDetecting(false);
        setPulseData([]);
      }
      return next;
    });
  }, []);

  const startDetection = useCallback(() => {
    if (useDeviceHealthSensor) return;
    setIsDetecting(true);
  }, [useDeviceHealthSensor]);

  const stopDetection = useCallback(() => {
    if (useDeviceHealthSensor) return;
    setIsDetecting(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, [useDeviceHealthSensor]);

  useEffect(() => {
    if (!isDetecting || useDeviceHealthSensor) return;
    if (!videoRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 64;
      canvasRef.current.height = 64;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    const SAMPLE_WINDOW = 150;

    const processFrame = () => {
      if (!videoRef.current || !isDetecting) return;

      try {
        ctx.drawImage(videoRef.current, 0, 0, 64, 64);
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;

        let rSum = 0;
        let gSum = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i + 1];
        }
        const rAvg = rSum / pixelCount;
        const gAvg = gSum / pixelCount;
        const signal = rAvg - gAvg * 0.5;

        samplesRef.current.push(signal);
        if (samplesRef.current.length > SAMPLE_WINDOW) {
          samplesRef.current.shift();
        }

        frameCount++;
        if (frameCount % 30 === 0 && samplesRef.current.length >= 60) {
          const samples = samplesRef.current;
          const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
          const normalized = samples.map((s) => s - mean);

          let crossings = 0;
          for (let i = 1; i < normalized.length; i++) {
            if (normalized[i - 1] < 0 && normalized[i] >= 0) crossings++;
          }

          const fps = 30;
          const duration = samples.length / fps;
          const estimatedBpm = Math.round((crossings / duration) * 60);

          if (estimatedBpm > 40 && estimatedBpm < 200) {
            bpmHistoryRef.current.push(estimatedBpm);
            if (bpmHistoryRef.current.length > 5) bpmHistoryRef.current.shift();

            const avgBpm = Math.round(
              bpmHistoryRef.current.reduce((a, b) => a + b, 0) / bpmHistoryRef.current.length
            );
            setBpm(avgBpm);
            setConfidence(Math.min(100, bpmHistoryRef.current.length * 20));
            setPulseData([...normalized.slice(-20).map((v) => v + mean)]);

            const now = Date.now();
            if (now - lastBeatRef.current > 500) {
              lastBeatRef.current = now;
              if (avgBpm > 60 && avgBpm < 100) {
                setIsSynced(true);
                if (navigator.vibrate) navigator.vibrate(50);
              }
            }
          }
        }
      } catch {
        // Video not ready yet
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isDetecting, useDeviceHealthSensor, videoRef]);

  return {
    bpm,
    confidence,
    isDetecting,
    isSynced,
    pulseData,
    startDetection,
    stopDetection,
    useDeviceHealthSensor,
    toggleDeviceHealthSensor,
  };
}
