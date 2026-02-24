import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Health Check
  public query ({ caller }) func ping() : async Bool {
    true;
  };

  // User Profiles
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userFactoryResetEnabled = Map.empty<Principal, Bool>();
  let photoAccessControlEnabled = Map.empty<Text, Bool>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or require admin access");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Factory Reset System
  public query ({ caller }) func isFactoryResetEnabledForUser(user : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check factory reset status");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own factory reset status");
    };
    switch (userFactoryResetEnabled.get(user)) {
      case (?enabled) { enabled };
      case (null) { false };
    };
  };

  public shared ({ caller }) func toggleFactoryReset(enable : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle factory reset");
    };
    userFactoryResetEnabled.add(caller, enable);
  };

  public shared ({ caller }) func performFactoryReset(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform factory reset");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only reset your own data");
    };

    switch (userFactoryResetEnabled.get(user)) {
      case (?enabled) {
        if (not enabled) {
          Runtime.trap("Factory reset not enabled for this user");
        };
      };
      case (null) {
        Runtime.trap("Factory reset not enabled for this user");
      };
    };

    userProfiles.remove(user);
    userFactoryResetEnabled.remove(user);
  };

  // Spine Room System
  let rooms = Map.empty<Text, Principal>();

  // Error Type for createRoom
  public type CreateRoomResult = {
    #success : Text;
    #duplicateId : Text;
    #invalidFormat : Text;
    #unauthorized : Text;
  };

  public shared ({ caller }) func createRoom(roomId : Text) : async CreateRoomResult {
    // Authorization check must come first to avoid leaking information to unauthorized callers
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      #unauthorized("Unauthorized: Only users can create rooms");
    } else if (roomId.size() > 20) {
      #invalidFormat("Room ID validation failed: must have max 20 characters.");
    } else {
      let lowerRoomId = roomId.toLower();
      let roomExists = rooms.toArray().any(
        func((k, _)) { k.toLower() == lowerRoomId }
      );
      if (roomExists) {
        #duplicateId("Id already exists (case-insensitive): " # roomId);
      } else {
        rooms.add(roomId, caller);
        #success(roomId);
      };
    };
  };

  public query ({ caller }) func verifyRoomCreator(roomId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can verify room creators");
    };
    switch (rooms.get(roomId)) {
      case (?creator) { creator == caller };
      case (null) { Runtime.trap("Room does not exist") };
    };
  };

  public shared ({ caller }) func deleteRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete rooms");
    };
    switch (rooms.get(roomId)) {
      case (?creator) {
        if (creator != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the room creator or admin can delete this room");
        };
        rooms.remove(roomId);
      };
      case (null) {
        Runtime.trap("Room does not exist");
      };
    };
  };

  public query ({ caller }) func getRoomCreator(roomId : Text) : async ?Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get room creator");
    };
    rooms.get(roomId);
  };

  // Photos
  type Photo = {
    photographer : Principal;
    photoBlob : Storage.ExternalBlob;
    timestamp : Int;
  };

  let photos = Map.empty<Text, [Photo]>();

  public shared ({ caller }) func takePhoto(roomId : Text, externalBlob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can take photos");
    };

    switch (rooms.get(roomId)) {
      case (?_creator) {
        let newPhoto : Photo = {
          photographer = caller;
          photoBlob = externalBlob;
          timestamp = 0;
        };

        let existingPhotos = photos.get(roomId);
        switch (existingPhotos) {
          case (?photoArray) {
            photos.add(roomId, photoArray.concat([newPhoto]));
          };
          case (null) {
            photos.add(roomId, [newPhoto]);
          };
        };
      };
      case (null) {
        Runtime.trap("Room does not exist");
      };
    };
  };

  public query ({ caller }) func getPhotosByRoom(roomId : Text) : async [Photo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view photos");
    };

    switch (photos.get(roomId)) {
      case (?photoArray) { photoArray };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getUserPhotos(user : Principal) : async [Photo] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own photos or require admin access");
    };

    let flatPhotoArray = photos.toArray().flatMap(
      func((_, photoArray)) {
        photoArray.filter(func(photo) { photo.photographer == user }).values();
      }
    );
    flatPhotoArray;
  };

  // Dynamic Photo Access Control
  public query ({ caller }) func isRoomPhotoAccessControlEnabled(roomId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check room photo access control");
    };

    switch (rooms.get(roomId)) {
      case (?creator) {
        if (caller != creator and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only room creator or admin can check photo access control");
        };
      };
      case (null) {
        Runtime.trap("Room does not exist");
      };
    };

    switch (photoAccessControlEnabled.get(roomId)) {
      case (?enabled) { enabled };
      case (null) { false };
    };
  };

  public shared ({ caller }) func toggleRoomPhotoAccessControl(roomId : Text, enable : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle room photo access control");
    };

    switch (rooms.get(roomId)) {
      case (?creator) {
        if (caller != creator and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only room creator or admin can toggle photo access control");
        };
      };
      case (null) {
        Runtime.trap("Room does not exist");
      };
    };

    photoAccessControlEnabled.add(roomId, enable);
  };

  public query ({ caller }) func getPhotoAccess(_ : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check photo access");
    };
    true;
  };
};

