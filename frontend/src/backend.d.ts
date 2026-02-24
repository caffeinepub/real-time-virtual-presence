import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type CreateRoomResult = {
    __kind__: "invalidFormat";
    invalidFormat: string;
} | {
    __kind__: "duplicateId";
    duplicateId: string;
} | {
    __kind__: "success";
    success: string;
} | {
    __kind__: "unauthorized";
    unauthorized: string;
};
export interface UserProfile {
    name: string;
}
export interface Photo {
    photoBlob: ExternalBlob;
    photographer: Principal;
    timestamp: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(roomId: string): Promise<CreateRoomResult>;
    deleteRoom(roomId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPhotoAccess(arg0: string): Promise<boolean>;
    getPhotosByRoom(roomId: string): Promise<Array<Photo>>;
    getRoomCreator(roomId: string): Promise<Principal | null>;
    getUserPhotos(user: Principal): Promise<Array<Photo>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isFactoryResetEnabledForUser(user: Principal): Promise<boolean>;
    isRoomPhotoAccessControlEnabled(roomId: string): Promise<boolean>;
    performFactoryReset(user: Principal): Promise<void>;
    ping(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    takePhoto(roomId: string, externalBlob: ExternalBlob): Promise<void>;
    toggleFactoryReset(enable: boolean): Promise<void>;
    toggleRoomPhotoAccessControl(roomId: string, enable: boolean): Promise<void>;
    verifyRoomCreator(roomId: string): Promise<boolean>;
}
