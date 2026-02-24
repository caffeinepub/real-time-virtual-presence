import { useState, useCallback } from 'react';

// TODO: Replace with full Snap Camera Kit SDK binding — load the SDK from CDN and call CameraKit.applyLens()
// Reference: https://docs.snap.com/camera-kit/integrate-sdk/web/web-ar

const SNAP_LENS_GROUP_ID = import.meta.env.VITE_SNAP_LENS_GROUP_ID as string | undefined;
const SNAP_API_TOKEN = import.meta.env.VITE_SNAP_API_TOKEN as string | undefined;

export function useSnapCameraKit() {
  const [snapEffectsEnabled, setSnapEffectsEnabled] = useState(false);

  const toggleSnapEffects = useCallback(() => {
    setSnapEffectsEnabled((prev) => {
      const next = !prev;
      if (next) {
        console.info('[SnapCameraKit] Snap Effects enabled. Lens Group ID:', SNAP_LENS_GROUP_ID || '(not set)');
      } else {
        console.info('[SnapCameraKit] Snap Effects disabled.');
      }
      return next;
    });
  }, []);

  const applyLens = useCallback(
    (lensId: string) => {
      if (!snapEffectsEnabled) return;
      // TODO: Replace console.log with full Snap Camera Kit SDK binding
      // Load the SDK from CDN: https://cdn.jsdelivr.net/npm/@snap/camera-kit
      // Then call: cameraKit.createSession() → session.applyLens(lens)
      // Use SNAP_LENS_GROUP_ID and SNAP_API_TOKEN for authentication
      console.log(`[SnapCameraKit] Applying lens: ${lensId}`, {
        lensGroupId: SNAP_LENS_GROUP_ID || '(not set)',
        apiToken: SNAP_API_TOKEN ? '(set)' : '(not set)',
      });
    },
    [snapEffectsEnabled]
  );

  return { snapEffectsEnabled, toggleSnapEffects, applyLens };
}
