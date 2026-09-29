export type UserRole = 'admin' | 'viewer' | 'participant';

/**
 * Represents a user profile stored in Firestore and loaded into the session.
 */
export interface UserProfile {
  uid: string;
  displayName?: string | null;
  roomName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  role?: UserRole | string;
  disabled?: boolean;
  createdAt?: any;
  createdBy?: string | null;
  transferredAt?: any;
  transferredBy?: string | null;
}

