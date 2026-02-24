import { useState, useCallback, useEffect, useRef } from 'react';

interface KissParticle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
}

interface LipMark {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export function useFlyingKiss() {
  const [isListening, setIsListening] = useState(false);
  const [particles, setParticles] = useState<KissParticle[]>([]);
  const [lipMarks, setLipMarks] = useState<LipMark[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsListening(true);

      // Monitor audio for blow detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkBlow = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        // Detect blow gesture (sudden spike in low frequencies)
        if (average > 100) {
          triggerKiss();
        }

        if (isListening) {
          requestAnimationFrame(checkBlow);
        }
      };

      checkBlow();
    } catch (error) {
      console.error('Failed to access microphone:', error);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
  }, []);

  const triggerKiss = useCallback(() => {
    const newParticle: KissParticle = {
      id: `kiss-${Date.now()}`,
      startX: 20,
      startY: 50,
      endX: 80,
      endY: 50,
      progress: 0,
    };

    setParticles(prev => [...prev, newParticle]);

    // Animate particle
    const animationDuration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      setParticles(prev =>
        prev.map(p =>
          p.id === newParticle.id ? { ...p, progress } : p
        )
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove particle and add lip mark
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        addLipMark(newParticle.endX, newParticle.endY);
      }
    };

    animate();
  }, []);

  const addLipMark = useCallback((x: number, y: number) => {
    const newMark: LipMark = {
      id: `mark-${Date.now()}`,
      x,
      y,
      timestamp: Date.now(),
    };

    setLipMarks(prev => [...prev, newMark]);

    // Remove lip mark after 5 seconds
    setTimeout(() => {
      setLipMarks(prev => prev.filter(m => m.id !== newMark.id));
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    particles,
    lipMarks,
    startListening,
    stopListening,
    triggerKiss,
  };
}
