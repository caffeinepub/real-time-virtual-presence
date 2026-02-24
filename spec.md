# Specification

## Summary
**Goal:** Fix the camera permission failure on Chrome for Windows where the browser incorrectly reports the permission as "denied" even though the user has granted access, causing the camera to be blocked in both the AR room and Shared Room `CameraPermissionGate` components.

**Planned changes:**
- At the start of the camera acquisition flow, query `navigator.permissions.query({ name: 'camera' })` and log the result; if this query throws, fall back directly to `getUserMedia` rather than treating it as a denial.
- Attempt `getUserMedia` with three constraint tiers (ideal → `{ video: true }` → `{ video: {} }`) with exponential backoff retries (250 ms, 500 ms, 1000 ms per tier) regardless of the Permissions API state.
- If the Permissions API returns "denied" but `getUserMedia` succeeds, accept the stream and proceed — do not block access.
- Only treat the camera as truly blocked if `getUserMedia` throws `NotAllowedError` after exhausting all tiers and retries.
- Clear `localStorage.removeItem('cameraPermissionGranted')` on definitive failure; write `cameraPermissionGranted=true` on success.
- Update the diagnostic panel to display: raw Permissions API state, whether the query threw, browser user-agent, `navigator.mediaDevices` availability, and the last `getUserMedia` error name and message.
- The "Try Again" button re-queries the Permissions API fresh and re-runs the full tiered acquisition sequence.
- Add a Chrome-on-Windows specific note in the denied/blocked error UI: "If you recently granted camera access but still see this error, click Try Again — Chrome sometimes reports permissions incorrectly. If the problem persists: click the camera/lock icon in the address bar → Site settings → Camera → set to Allow, then click Try Again."
- Apply all changes identically to both `frontend/src/components/ar-room/CameraPermissionGate.tsx` and `frontend/src/components/shared-room/CameraPermissionGate.tsx`.

**User-visible outcome:** On Chrome for Windows, users who have already granted camera access will no longer see a false "Camera permission is denied in browser settings" error — the camera will open successfully. Users who do encounter an error will see improved diagnostics and Chrome-specific guidance to resolve it.
