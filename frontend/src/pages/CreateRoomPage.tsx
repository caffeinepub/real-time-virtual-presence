import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActor } from "../hooks/useActor";
import { useCreateRoom } from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, Wifi } from "lucide-react";
import { toast } from "sonner";

const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 500;

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const createRoomMutation = useCreateRoom();

  const [roomId, setRoomId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "initializing" | "ready" | "failed"
  >("initializing");

  const retryCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Deterministic actor readiness check with retry
  useEffect(() => {
    // If actor is already available, mark ready immediately
    if (actor && !actorFetching) {
      setConnectionStatus("ready");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If actor query is still fetching, wait for it
    if (actorFetching) {
      setConnectionStatus("initializing");
      return;
    }

    // Actor query done but actor not available — start polling
    if (!actor && !actorFetching) {
      retryCountRef.current = 0;

      intervalRef.current = setInterval(() => {
        retryCountRef.current += 1;

        if (actor) {
          setConnectionStatus("ready");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        if (retryCountRef.current >= MAX_RETRIES) {
          setConnectionStatus("failed");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, RETRY_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [actor, actorFetching]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error("Please log in to create a room.");
      return;
    }

    if (!actor) {
      toast.error("Backend not connected. Please refresh the page.");
      return;
    }

    const trimmed = roomId.trim();
    if (!trimmed) {
      toast.error("Please enter a room ID.");
      return;
    }

    if (trimmed.length > 20) {
      toast.error("Room ID must be 20 characters or fewer.");
      return;
    }

    try {
      await createRoomMutation.mutateAsync(trimmed);
      toast.success(`Room "${trimmed}" created!`);
      navigate({ to: `/room/${trimmed}` });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create room.";
      toast.error(message);
    }
  };

  const isSubmitDisabled =
    connectionStatus !== "ready" ||
    createRoomMutation.isPending ||
    !identity ||
    !roomId.trim();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create a Room</CardTitle>
          <CardDescription>
            Set up a new shared space for your session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="e.g. my-room-123"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                maxLength={20}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Max 20 characters. Case-insensitive.
              </p>
            </div>

            {/* Connection status indicator */}
            {connectionStatus === "initializing" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Initializing connection…</span>
              </div>
            )}

            {connectionStatus === "failed" && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Could not connect to backend — please refresh the page.
                </span>
              </div>
            )}

            {connectionStatus === "ready" && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                <Wifi className="h-4 w-4 shrink-0" />
                <span>Connected</span>
              </div>
            )}

            {!identity && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please log in to create a room.</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitDisabled}
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
