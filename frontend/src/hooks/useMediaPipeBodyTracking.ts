import { useState, useCallback } from 'react';

// TODO: Load MediaPipe Pose from CDN (https://cdn.jsdelivr.net/npm/@mediapipe/pose)
// and replace mockSkeletonJoints with real pose landmark data from pose.onResults().
// Initialize Pose with video element and process frames in requestAnimationFrame loop.

export interface SkeletonJoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  label: string;
  color: string;
}

// 17 key points representing a human skeleton in normalized canvas space (0-1)
const MOCK_SKELETON_JOINTS: SkeletonJoint[] = [
  { x: 0.5, y: 0.08, label: 'nose', color: '#ff6b6b' },
  { x: 0.46, y: 0.07, label: 'left_eye', color: '#ff6b6b' },
  { x: 0.54, y: 0.07, label: 'right_eye', color: '#ff6b6b' },
  { x: 0.44, y: 0.09, label: 'left_ear', color: '#ff6b6b' },
  { x: 0.56, y: 0.09, label: 'right_ear', color: '#ff6b6b' },
  { x: 0.4, y: 0.22, label: 'left_shoulder', color: '#ffd93d' },
  { x: 0.6, y: 0.22, label: 'right_shoulder', color: '#ffd93d' },
  { x: 0.35, y: 0.38, label: 'left_elbow', color: '#6bcb77' },
  { x: 0.65, y: 0.38, label: 'right_elbow', color: '#6bcb77' },
  { x: 0.32, y: 0.52, label: 'left_wrist', color: '#4d96ff' },
  { x: 0.68, y: 0.52, label: 'right_wrist', color: '#4d96ff' },
  { x: 0.42, y: 0.55, label: 'left_hip', color: '#ffd93d' },
  { x: 0.58, y: 0.55, label: 'right_hip', color: '#ffd93d' },
  { x: 0.41, y: 0.72, label: 'left_knee', color: '#6bcb77' },
  { x: 0.59, y: 0.72, label: 'right_knee', color: '#6bcb77' },
  { x: 0.4, y: 0.88, label: 'left_ankle', color: '#4d96ff' },
  { x: 0.6, y: 0.88, label: 'right_ankle', color: '#4d96ff' },
];

// Skeleton connections for drawing bones
export const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], // head
  [5, 6], // shoulders
  [5, 7], [7, 9], // left arm
  [6, 8], [8, 10], // right arm
  [5, 11], [6, 12], // torso sides
  [11, 12], // hips
  [11, 13], [13, 15], // left leg
  [12, 14], [14, 16], // right leg
];

export function useMediaPipeBodyTracking() {
  const [bodyTrackingEnabled, setBodyTrackingEnabled] = useState(false);

  const toggleBodyTracking = useCallback(() => {
    setBodyTrackingEnabled((prev) => {
      const next = !prev;
      if (next) {
        // TODO: Load MediaPipe Pose from CDN and initialize with video element
        console.info('[MediaPipe] Body tracking enabled (mock mode). TODO: Load real MediaPipe Pose SDK.');
      } else {
        console.info('[MediaPipe] Body tracking disabled.');
      }
      return next;
    });
  }, []);

  return {
    bodyTrackingEnabled,
    toggleBodyTracking,
    skeletonJoints: MOCK_SKELETON_JOINTS,
    skeletonConnections: SKELETON_CONNECTIONS,
  };
}
