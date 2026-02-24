import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react';

interface CameraPermissionGateProps {
  onPermissionGranted: (stream: MediaStream) => void;
  onCancel?: () => void;
}

type GateState = 'checking' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';

const STORAGE_KEY = 'cameraPermissionGranted';

const CONSTRAINT_TIERS: { label: string; constraints: MediaStreamConstraints }[] = [
  {
    label: 'ideal',
    constraints: {
      video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
  },
  {
    label: 'minimal',
    constraints: { video: { facingMode: 'user' }, audio: false },
  },
  {
    label: 'bare',
    constraints: { video: true, audio: false },
  },
  {
    label: 'empty',
    constraints: { video: {}, audio: false },
  },
];

const BACKOFF_DELAYS = [250, 500, 1000];

/**
 * Query the Permissions API for camera state.
 * Returns { state, threw } — threw=true means the API itself threw (treat as unknown).
 */
async function queryPermissionState(): Promise<{ state: string; threw: boolean }> {
  if (!navigator.permissions) return { state: 'unknown', threw: false };
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return { state: status.state, threw: false };
  } catch {
    return { state: 'unknown', threw: true };
  }
}

/**
 * Try getUserMedia with exponential backoff.
 * IMPORTANT: We do NOT short-circuit on Permissions API 'denied' here —
 * Chrome on Windows can report 'denied' even when the user has actually granted access.
 * getUserMedia is the authoritative source of truth.
 */
async function tryWithBackoff(
  constraints: MediaStreamConstraints,
  retries = 3
): Promise<MediaStream> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: unknown) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[i] ?? 1000));
      }
    }
  }
  throw lastError;
}

/**
 * Try all constraint tiers in order.
 * Only stops early if getUserMedia itself throws NotAllowedError on ALL tiers.
 */
async function tryAllTiers(): Promise<MediaStream> {
  let lastError: unknown;
  for (const tier of CONSTRAINT_TIERS) {
    try {
      return await tryWithBackoff(tier.constraints);
    } catch (err: unknown) {
      lastError = err;
      // Continue to next tier regardless of error type —
      // Chrome Windows may throw NotAllowedError on specific constraints but succeed on bare ones.
    }
  }
  throw lastError;
}

function getBrowserInfo(): {
  name: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isAndroid: boolean;
  isIOS: boolean;
} {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg\//i.test(ua);
  const isEdge = /Edg\//i.test(ua);

  let name = 'Unknown Browser';
  if (isFirefox) name = 'Firefox';
  else if (isEdge) name = 'Edge';
  else if (isChrome) name = 'Chrome';
  else if (isSafari) name = 'Safari';

  return { name, isChrome, isFirefox, isSafari, isAndroid, isIOS };
}

function BrowserInstructions({
  isChrome,
  isFirefox,
  isSafari,
  isAndroid,
}: ReturnType<typeof getBrowserInfo>) {
  if (isChrome && isAndroid) {
    return (
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
        <li>Tap the <strong>lock icon</strong> in the address bar</li>
        <li>Tap <strong>Permissions</strong> → <strong>Camera</strong></li>
        <li>Select <strong>Allow</strong></li>
        <li>Come back and tap <strong>Try Again</strong> below</li>
      </ol>
    );
  }
  if (isChrome) {
    return (
      <>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Click the <strong>lock / camera icon</strong> in the address bar</li>
          <li>Click <strong>Site settings</strong></li>
          <li>Find <strong>Camera</strong> and set it to <strong>Allow</strong></li>
          <li>Click <strong>Try Again</strong> below (no page reload needed)</li>
        </ol>
        <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Or open Chrome camera settings directly:</p>
          <a
            href="chrome://settings/content/camera"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
          >
            chrome://settings/content/camera <ExternalLink className="w-3 h-3" />
          </a>
          <p className="mt-1 text-xs opacity-70">
            Note: Chrome may block this link — if so, copy and paste it into your address bar manually.
          </p>
        </div>
      </>
    );
  }
  if (isFirefox) {
    return (
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
        <li>Click the <strong>lock icon</strong> in the address bar</li>
        <li>Click <strong>Connection Secure</strong> → <strong>More Information</strong></li>
        <li>Go to the <strong>Permissions</strong> tab</li>
        <li>Find <strong>Use the Camera</strong> and click <strong>Allow</strong></li>
        <li>Click <strong>Try Again</strong> below</li>
      </ol>
    );
  }
  if (isSafari) {
    return (
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
        <li>Go to <strong>Settings</strong> → <strong>Safari</strong> → <strong>Camera</strong></li>
        <li>Find this site and set it to <strong>Allow</strong></li>
        <li>Click <strong>Try Again</strong> below</li>
      </ol>
    );
  }
  return (
    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
      <li>Click the <strong>lock icon</strong> in the address bar</li>
      <li>Find <strong>Camera</strong> permissions and set to <strong>Allow</strong></li>
      <li>Click <strong>Try Again</strong> below</li>
    </ol>
  );
}

export default function CameraPermissionGate({ onPermissionGranted, onCancel }: CameraPermissionGateProps) {
  const [gateState, setGateState] = useState<GateState>('checking');
  const [lastErrorName, setLastErrorName] = useState<string>('');
  const [lastErrorMsg, setLastErrorMsg] = useState<string>('');
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [permApiThrew, setPermApiThrew] = useState<boolean>(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [stillBlocked, setStillBlocked] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const calledBack = useRef(false);
  const permStatusRef = useRef<PermissionStatus | null>(null);
  const attemptingRef = useRef(false);

  const browserInfo = getBrowserInfo();
  const mediaDevicesAvailable = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const attemptCamera = useCallback(
    async (silent = false) => {
      if (calledBack.current) return;
      if (attemptingRef.current) return;
      attemptingRef.current = true;
      setStillBlocked(false);

      if (!silent) setGateState('requesting');

      // Query Permissions API for diagnostic info only — do NOT bail out based on its result.
      // Chrome on Windows can report 'denied' even when the user has actually granted access.
      // getUserMedia is the authoritative source of truth.
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionState(status.state);
          setPermApiThrew(false);
        } catch {
          setPermApiThrew(true);
          // Permissions API threw — fall through to getUserMedia directly
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setLastErrorName('NotSupportedError');
        setLastErrorMsg('navigator.mediaDevices.getUserMedia is not available in this browser/context.');
        setGateState(silent ? 'prompt' : 'error');
        setDiagOpen(true);
        attemptingRef.current = false;
        return;
      }

      try {
        const stream = await tryAllTiers();
        // getUserMedia succeeded — camera is accessible regardless of what Permissions API said
        calledBack.current = true;
        localStorage.setItem(STORAGE_KEY, 'true');
        setPermissionState('granted');
        setGateState('granted');
        attemptingRef.current = false;
        onPermissionGranted(stream);
      } catch (err: unknown) {
        attemptingRef.current = false;
        const domErr = err as DOMException;
        const errName = domErr?.name || 'UnknownError';
        const errMsg = domErr?.message || String(err);
        setLastErrorName(errName);
        setLastErrorMsg(errMsg);

        // Re-query Permissions API after failure for accurate diagnostic display
        const { state: finalState, threw: finalThrew } = await queryPermissionState();
        setPermissionState(finalState);
        setPermApiThrew(finalThrew);

        // Only show 'denied' screen if getUserMedia definitively failed AND
        // the Permissions API confirms denied (or it's a clear NotAllowedError with no API quirk)
        const isDefinitelyDenied =
          (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') &&
          (finalState === 'denied' || finalThrew === false);

        if (isDefinitelyDenied && finalState === 'denied') {
          localStorage.removeItem(STORAGE_KEY);
          setGateState('denied');
          setDiagOpen(true);
        } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          // getUserMedia failed with NotAllowedError but Permissions API doesn't confirm denied
          // (Chrome Windows quirk) — show prompt so user can try again
          setGateState('prompt');
          setDiagOpen(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setGateState(silent ? 'prompt' : 'error');
          setDiagOpen(true);
        }
      }
    },
    [onPermissionGranted]
  );

  // Try Again handler — always attempts getUserMedia regardless of Permissions API state
  const handleTryAgain = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    setStillBlocked(false);

    try {
      // Re-query Permissions API for fresh diagnostic info only — do NOT bail based on result
      const { state: freshState, threw: freshThrew } = await queryPermissionState();
      setPermissionState(freshState);
      setPermApiThrew(freshThrew);

      // Always attempt getUserMedia — Chrome Windows may report 'denied' incorrectly
      calledBack.current = false;
      attemptingRef.current = false;
      setLastErrorName('');
      setLastErrorMsg('');
      setRetrying(false);
      await attemptCamera(false);
    } catch {
      setRetrying(false);
    }
  }, [retrying, attemptCamera]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          permStatusRef.current = status;
          setPermissionState(status.state);

          const handleChange = () => {
            setPermissionState(status.state);
            if (status.state === 'granted' && !calledBack.current) {
              calledBack.current = false;
              attemptCamera(false);
            }
          };

          status.addEventListener('change', handleChange);
          cleanup = () => status.removeEventListener('change', handleChange);
        } catch {
          // Permissions API not supported
        }
      }

      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached === 'true') {
        attemptCamera(true);
      } else {
        setGateState('prompt');
      }
    };

    init();

    return () => {
      cleanup?.();
    };
  }, [attemptCamera]);

  const lastError = lastErrorName ? `${lastErrorName}: ${lastErrorMsg}` : '';

  if (gateState === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Checking camera access…</p>
      </div>
    );
  }

  if (gateState === 'granted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
        <Camera className="w-12 h-12 text-green-500" />
        <p className="text-foreground font-medium">Camera access granted!</p>
      </div>
    );
  }

  const DiagnosticPanel = () => (
    <div className="w-full border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setDiagOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <span>Diagnostic Info</span>
        {diagOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {diagOpen && (
        <div className="px-4 py-3 text-xs space-y-1 bg-background text-muted-foreground font-mono">
          <div><span className="text-foreground">Permission:</span> {permissionState}</div>
          <div><span className="text-foreground">Permissions API threw:</span> {permApiThrew ? 'yes' : 'no'}</div>
          <div><span className="text-foreground">Browser:</span> {browserInfo.name}</div>
          <div><span className="text-foreground">mediaDevices:</span> {mediaDevicesAvailable ? 'available' : 'NOT available'}</div>
          <div><span className="text-foreground">UA:</span> {navigator.userAgent.slice(0, 100)}</div>
          {lastErrorName && <div><span className="text-foreground">Last Error:</span> {lastErrorName}: {lastErrorMsg}</div>}
        </div>
      )}
    </div>
  );

  if (gateState === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Camera Access Blocked</h3>
          <p className="text-muted-foreground text-sm">
            Camera access is blocked in your browser settings. You must manually allow camera access before continuing.
          </p>
        </div>

        {/* Chrome-specific guidance: Chrome may incorrectly report denied */}
        {browserInfo.isChrome && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-400 w-full text-left">
            <p className="font-medium mb-1">💡 Chrome tip: Try Again first</p>
            <p className="text-xs opacity-90">
              Chrome sometimes incorrectly reports camera permissions as denied even when you've already granted access.
              <strong> Click "Try Again" below first</strong> — it may work without any settings changes.
              If it still fails, follow the steps below.
            </p>
          </div>
        )}

        {stillBlocked && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400 w-full text-left">
            <p className="font-medium">Camera is still blocked</p>
            <p className="text-xs mt-1 opacity-90">
              Please follow the browser instructions below and click <strong>Try Again</strong> once more.
            </p>
          </div>
        )}

        <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2 w-full">
          <p className="font-medium text-foreground mb-2">
            Step-by-step instructions for {browserInfo.name}:
          </p>
          <BrowserInstructions {...browserInfo} />
        </div>

        <DiagnosticPanel />

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleTryAgain}
            disabled={retrying}
            className="flex-1 gap-2"
          >
            {retrying ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </>
            )}
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={retrying} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // prompt, error, or requesting states
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 p-8 max-w-md mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Camera className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Camera Access Required</h3>
        <p className="text-muted-foreground text-sm">
          Virtual Room needs your camera to connect with your partner in the shared space.
        </p>
      </div>

      {gateState === 'error' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive w-full text-left">
          <p className="font-medium mb-1">Camera initialization failed</p>
          <p className="text-xs opacity-80">{lastError || 'Unknown error. Please try again.'}</p>
        </div>
      )}

      {/* Show Chrome tip on prompt state too if there's a NotAllowedError */}
      {browserInfo.isChrome && gateState === 'prompt' && lastErrorName === 'NotAllowedError' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-400 w-full text-left">
          <p className="font-medium mb-1">💡 Chrome tip</p>
          <p className="text-xs opacity-90">
            Chrome may report permissions incorrectly. Try clicking <strong>Grant Access</strong> again — it often works on a second attempt.
          </p>
        </div>
      )}

      <DiagnosticPanel />

      <div className="flex gap-3 w-full">
        <Button
          onClick={() => {
            calledBack.current = false;
            attemptingRef.current = false;
            attemptCamera(false);
          }}
          disabled={gateState === 'requesting'}
          className="flex-1 gap-2"
        >
          {gateState === 'requesting' ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Requesting…
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Grant Access
            </>
          )}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={gateState === 'requesting'} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
