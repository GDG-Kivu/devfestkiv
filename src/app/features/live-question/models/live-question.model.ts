export interface FloatingReaction {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  animationClass: string;
  uid?: string;
}
/** Live question submitted in events/{editionId}/sessions/{sessionId}/questions. */
export interface LiveQuestion {
  id?: string;
  uid: string;
  contenu: string;
  createdAt: unknown;
  displayName?: string | null;
  email?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reactions?: { emoji: string; count: number }[];
  showReactions?: boolean;
  time?: string;
}
