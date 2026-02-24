import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Camera, RefreshCw } from 'lucide-react';

interface CameraError {
  type: 'permission' | 'not-supported' | 'not-found' | 'unknown' | 'timeout';
  message: string;
}

interface CameraErrorDisplayProps {
  error: CameraError;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function CameraErrorDisplay({ error, onRetry, isRetrying = false }: CameraErrorDisplayProps) {
  const getErrorContent = () => {
    switch (error.type) {
      case 'permission':
        return {
          title: 'Camera Permission Denied',
          description: (
            <div className="space-y-3">
              <p>Camera access was denied. To use this feature, you need to grant camera permission.</p>
              <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-md">
                <p className="font-semibold">How to enable camera access:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Chrome/Edge (Desktop):</strong> Click the camera icon with X in the address bar → Site settings → Camera → Allow</li>
                  <li><strong>Chrome (Android):</strong> Tap the lock icon in address bar → Permissions → Camera → Allow</li>
                  <li><strong>Firefox:</strong> Click the crossed camera icon in address bar → Clear permissions and reload</li>
                  <li><strong>Safari (iOS):</strong> Settings → Safari → Camera → Allow</li>
                  <li><strong>Safari (Mac):</strong> Safari → Settings for This Website → Camera → Allow</li>
                  <li><strong>Android Browser:</strong> Settings → Apps → Browser → Permissions → Camera → Allow</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">After enabling permissions, reload the page and click retry.</p>
            </div>
          ),
        };
      case 'not-supported':
        return {
          title: 'Camera Not Supported',
          description: 'Your browser or device does not support camera access. Please try using a modern browser like Chrome, Firefox, Safari, or Edge.',
        };
      case 'not-found':
        return {
          title: 'No Camera Found',
          description: 'No camera device was detected on your device. Please connect a camera and try again.',
        };
      case 'timeout':
        return {
          title: 'Camera Timeout',
          description: 'Camera initialization timed out. This might be due to the camera being used by another application. Please close other apps using the camera and try again.',
        };
      default:
        return {
          title: 'Camera Error',
          description: `An error occurred while accessing the camera: ${error.message}. Please try again or check your browser settings.`,
        };
    }
  };

  const { title, description } = getErrorContent();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {typeof description === 'string' ? <p>{description}</p> : description}
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2 justify-center">
        <Button onClick={onRetry} disabled={isRetrying} size="lg" className="gap-2">
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Retry Camera Access
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
