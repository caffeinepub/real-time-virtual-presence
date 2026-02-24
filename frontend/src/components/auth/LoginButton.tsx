import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoading = loginStatus === 'logging-in';
  const isInitializing = loginStatus === 'initializing';

  const handleAuth = async () => {
    if (isAuthenticated) {
      try {
        await clear();
        queryClient.clear();
        toast.success('Logged out successfully');
      } catch (error: any) {
        console.error('Logout error:', error);
        toast.error('Failed to logout: ' + (error.message || 'Unknown error'));
      }
    } else {
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: any) {
        console.error('Login error:', error);
        // If user is already authenticated, clear and retry
        if (error.message === 'User is already authenticated') {
          try {
            await clear();
            queryClient.clear();
            // Small delay to ensure cleanup completes
            setTimeout(async () => {
              try {
                await login();
                toast.success('Logged in successfully');
              } catch (retryError: any) {
                console.error('Retry login error:', retryError);
                toast.error('Failed to login: ' + (retryError.message || 'Unknown error'));
              }
            }, 300);
          } catch (clearError: any) {
            console.error('Clear error:', clearError);
            toast.error('Failed to clear session: ' + (clearError.message || 'Unknown error'));
          }
        } else {
          toast.error('Failed to login: ' + (error.message || 'Unknown error'));
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoading || isInitializing}
      variant={isAuthenticated ? 'outline' : 'default'}
      className="gap-2"
    >
      {isLoading || isInitializing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {isInitializing ? 'Initializing...' : 'Connecting...'}
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut className="w-4 h-4" />
          Logout
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          Login
        </>
      )}
    </Button>
  );
}
