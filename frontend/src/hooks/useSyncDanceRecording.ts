import { useState, useRef, useCallback } from 'react';

interface SyncDanceRecordingResult {
  localBlob: Blob | null;
  remoteBlob: Blob | null;
}

export function useSyncDanceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<SyncDanceRecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localRecorderRef = useRef<MediaRecorder | null>(null);
  const remoteRecorderRef = useRef<MediaRecorder | null>(null);
  const localChunksRef = useRef<Blob[]>([]);
  const remoteChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async (
    localStream: MediaStream | null,
    remoteStream?: MediaStream | null
  ) => {
    setError(null);
    setResult(null);
    localChunksRef.current = [];
    remoteChunksRef.current = [];

    if (!localStream) {
      setError('No local camera stream available');
      return;
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const localRecorder = new MediaRecorder(localStream, { mimeType });
      localRecorderRef.current = localRecorder;
      localRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) localChunksRef.current.push(e.data);
      };

      let remoteRecorder: MediaRecorder | null = null;
      if (remoteStream) {
        remoteRecorder = new MediaRecorder(remoteStream, { mimeType });
        remoteRecorderRef.current = remoteRecorder;
        remoteRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) remoteChunksRef.current.push(e.data);
        };
      }

      setIsRecording(true);
      setCountdown(15);
      localRecorder.start(100);
      remoteRecorder?.start(100);

      let remaining = 15;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const finalize = () => {
      const localBlob = localChunksRef.current.length > 0
        ? new Blob(localChunksRef.current, { type: 'video/webm' })
        : null;
      const remoteBlob = remoteChunksRef.current.length > 0
        ? new Blob(remoteChunksRef.current, { type: 'video/webm' })
        : null;
      setResult({ localBlob, remoteBlob });
      setIsRecording(false);
      setCountdown(null);
    };

    const localRecorder = localRecorderRef.current;
    const remoteRecorder = remoteRecorderRef.current;

    if (localRecorder && localRecorder.state !== 'inactive') {
      localRecorder.onstop = finalize;
      localRecorder.stop();
    } else {
      finalize();
    }

    if (remoteRecorder && remoteRecorder.state !== 'inactive') {
      remoteRecorder.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsRecording(false);
    setCountdown(null);
  }, []);

  return {
    isRecording,
    countdown,
    result,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
