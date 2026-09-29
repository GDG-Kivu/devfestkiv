export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  role?: string;
  disabled?: boolean;
}
