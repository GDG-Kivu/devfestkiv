/** Common state of Firestore reads intended for components. */
export type FirestoreResult<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T; source: 'firestore' | 'fallback' }
  | { status: 'error'; error: unknown; fallback?: T };
