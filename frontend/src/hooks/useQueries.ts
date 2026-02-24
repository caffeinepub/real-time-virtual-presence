import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useActor } from "./useActor";
import type { UserProfile, Photo } from "../backend";
import { ExternalBlob } from "../backend";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createRoom(roomId);
      if (result.__kind__ === "success") {
        return result.success;
      } else if (result.__kind__ === "duplicateId") {
        throw new Error(result.duplicateId);
      } else if (result.__kind__ === "invalidFormat") {
        throw new Error(result.invalidFormat);
      } else if (result.__kind__ === "unauthorized") {
        throw new Error(result.unauthorized);
      }
      throw new Error("Unknown error creating room");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteRoom(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useGetRoomCreator(roomId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["roomCreator", roomId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getRoomCreator(roomId);
    },
    enabled: !!actor && !actorFetching && !!roomId,
  });
}

export function useVerifyRoomCreator(roomId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["verifyRoomCreator", roomId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyRoomCreator(roomId);
    },
    enabled: !!actor && !actorFetching && !!roomId,
    retry: false,
  });
}

export function useGetPhotosByRoom(roomId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Photo[]>({
    queryKey: ["photos", roomId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPhotosByRoom(roomId);
    },
    enabled: !!actor && !actorFetching && !!roomId,
    refetchInterval: 10000,
  });
}

export function useTakePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      blob,
    }: {
      roomId: string;
      blob: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.takePhoto(roomId, blob);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["photos", variables.roomId],
      });
    },
  });
}

export function useBackendHealth() {
  const { actor, isFetching: actorFetching } = useActor();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const query = useQuery<boolean>({
    queryKey: ["backendHealth"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Ping timeout")), 3000)
      );

      const pingPromise = actor.ping();
      const result = await Promise.race([pingPromise, timeoutPromise]);
      retryCountRef.current = 0;
      return result;
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
    retry: MAX_RETRIES,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (query.isError && !query.isFetching) {
      const retryCount = retryCountRef.current;
      if (retryCount < MAX_RETRIES) {
        retryCountRef.current += 1;
        toast.error("Backend connection failed — retrying…", {
          id: "backend-health",
          duration: 3000,
        });
      }
    }
  }, [query.isError, query.isFetching]);

  const isBackendUnavailable =
    query.isError && !query.isFetching && query.failureCount >= MAX_RETRIES;

  return {
    ...query,
    isBackendUnavailable,
  };
}
